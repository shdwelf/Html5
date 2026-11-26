// Streaming CSV prefilter for the published GeoCities URL graph.
// No network, files, anchor retention, crypto or URL authorization. Candidates
// flow by pipe to the Python exact-URL classifier, never directly to CI logs.
#include <array>
#include <cstdint>
#include <iostream>
#include <stdexcept>
#include <string>
#include <string_view>

namespace {
constexpr std::size_t maximumField = 65536;
char lowerAscii(char c) { return c >= 'A' && c <= 'Z' ? static_cast<char>(c + ('a' - 'A')) : c; }
int hex(char c) {
  c = lowerAscii(c);
  if (c >= '0' && c <= '9') return c - '0';
  if (c >= 'a' && c <= 'f') return c - 'a' + 10;
  return -1;
}
bool candidate(const std::string& value) {
  if (value.find("8099") != std::string::npos) return true;
  // Decode percent escapes once, just as the exact Python URL policy does.
  // This is a broad prefilter only: a number/handle match is never a backlink.
  std::string folded;
  folded.reserve(value.size());
  for (std::size_t i = 0; i < value.size(); ++i) {
    char c = value[i];
    if (c == '%' && i + 2 < value.size() && hex(value[i + 1]) >= 0 && hex(value[i + 2]) >= 0) {
      c = static_cast<char>(hex(value[i + 1]) * 16 + hex(value[i + 2]));
      i += 2;
    }
    folded.push_back(lowerAscii(c));
  }
  return folded.find("8099") != std::string::npos || folded.find("shadowelf") != std::string::npos;
}
std::string json(const std::string& value) {
  const char* digits = "0123456789abcdef";
  std::string out = "\"";
  for (unsigned char c : value) {
    if (c == '"' || c == '\\') { out += '\\'; out += static_cast<char>(c); }
    else if (c < 32) { out += "\\u00"; out += digits[c >> 4]; out += digits[c & 15]; }
    else out += static_cast<char>(c);
  }
  return out + '"';
}

// Incremental one-pass percent-decoded broad prefilter, used only when a URL
// exceeds the retained-field bound. No unbounded buffer or raw content output.
class OverflowMatcher {
  std::string tail;
  int percent = 0;
  char first = 0;
  void emit(char c) {
    tail.push_back(lowerAscii(c));
    if (tail.size() > 9) tail.erase(0, 1);
    if (tail.find("8099") != std::string::npos || tail == "shadowelf") matched = true;
  }
public:
  bool matched = false;
  void reset() { tail.clear(); percent = 0; first = 0; matched = false; }
  void feed(char c) {
    if (percent == 1) {
      if (hex(c) >= 0) { first = c; percent = 2; return; }
      emit('%'); percent = 0;
    } else if (percent == 2) {
      percent = 0;
      if (hex(c) >= 0) { emit(static_cast<char>(hex(first) * 16 + hex(c))); return; }
      emit('%'); emit(first);
    }
    if (c == '%') percent = 1;
    else emit(c);
  }
};

bool httpUrl(const std::string& value) {
  std::string prefix = value.substr(0, 8);
  for (auto& c : prefix) c = lowerAscii(c);
  return prefix.compare(0, 7, "http://") == 0 || prefix == "https://";
}

class Csv {
  std::array<std::string, 4> fields;
  std::size_t column = 0;
  bool quoted = false, afterQuote = false, started = false, skipLF = false;
  bool header = false;
  std::array<bool, 4> overflow{};
  std::array<OverflowMatcher, 4> overflowMatch;
  std::array<std::string, 4> schema;
  std::uint64_t rows = 0, candidates = 0, repeats = 0, blank = 0, bytes = 0;
  std::uint64_t oversizedHttp = 0, oversizedOther = 0, unclassified = 0;

  void append(char c) {
    // An anchor is never retained, even for a candidate. Its quoting still
    // participates in record framing, so embedded commas/newlines are safe.
    if (header && column == 3) return;
    if (fields[column].size() >= maximumField) {
      if (!header || column == 0) throw std::runtime_error("date-or-header-field-limit");
      if (!overflow[column]) {
        overflow[column] = true;
        if (httpUrl(fields[column])) {
          ++oversizedHttp;
          for (char prior : fields[column]) overflowMatch[column].feed(prior);
        } else ++oversizedOther;
      }
      if (httpUrl(fields[column])) overflowMatch[column].feed(c);
      return;
    }
    fields[column].push_back(c);
  }
  void fieldEnd() {
    if (++column >= 4) throw std::runtime_error("csv-column-count");
    started = false; afterQuote = false;
  }
  void recordEnd() {
    if (column == 0 && !started && !afterQuote && fields[0].empty()) { ++blank; return; }
    if (column != 3) throw std::runtime_error("csv-column-count");
    if (!header) {
      const std::array<std::string, 4> published = {"crawl_date", "source", "target", "anchor_text"};
      const std::array<std::string, 4> aut = {"crawl_date", "src", "dest", "anchor"};
      // A UTF-8 BOM is framing, not a data row or a wildcard schema.
      if (fields[0].compare(0, 3, "\xEF\xBB\xBF") == 0) fields[0].erase(0, 3);
      if (fields != published && fields != aut) throw std::runtime_error("unrecognized-csv-header");
      schema = fields; header = true;
      std::cout << "{\"type\":\"header\",\"recognized\":true}" << std::endl;
    } else if (fields[0] == schema[0] && fields[1] == schema[1] && fields[2] == schema[2]) {
      ++repeats; // Concatenated Spark parts can repeat headers.
    } else {
      ++rows;
      const bool sourceCandidate = overflow[1] ? overflowMatch[1].matched : candidate(fields[1]);
      const bool targetCandidate = overflow[2] ? overflowMatch[2].matched : candidate(fields[2]);
      if (sourceCandidate || targetCandidate) {
        ++candidates;
        if ((overflow[1] && httpUrl(fields[1])) || (overflow[2] && httpUrl(fields[2]))) {
          ++unclassified;
          std::cout << "{\"type\":\"unclassified\",\"row\":" << rows << ",\"reason\":\"oversized-http-candidate\"}\n";
        } else {
          // Oversized non-HTTP schemes are provably outside the Python URL
          // classifier. Do not serialize or misinterpret their truncated text.
          std::cout << "{\"type\":\"candidate\",\"row\":" << rows
                    << ",\"crawlDate\":" << json(fields[0]) << ",\"source\":" << json(overflow[1] ? "" : fields[1])
                    << ",\"target\":" << json(overflow[2] ? "" : fields[2]) << "}\n";
        }
      }
      if (rows % 10000000 == 0) {
        std::cout << "{\"type\":\"progress\",\"rows\":" << rows << ",\"uncompressedBytes\":" << bytes << "}" << std::endl;
      }
    }
    for (auto& field : fields) field.clear();
    overflow.fill(false);
    for (auto& matcher : overflowMatch) matcher.reset();
    column = 0; started = false; afterQuote = false;
  }
public:
  void feed(const char* data, std::size_t length) {
    for (std::size_t index = 0; index < length; ++index) {
      const char c = data[index]; ++bytes;
      if (skipLF) { skipLF = false; if (c == '\n') continue; }
      if (quoted) {
        // AUT's source-checked CSV recipe sets escape to the quote itself
        // (RFC doubled quotes), NOT backslash. Combining both dialects
        // misframes a valid field whose last literal character is a slash.
        if (c == '"') { quoted = false; afterQuote = true; }
        else append(c);
        continue;
      }
      if (afterQuote && c == '"') { append('"'); quoted = true; afterQuote = false; continue; }
      if (c == ',') { fieldEnd(); continue; }
      if (c == '\n' || c == '\r') { recordEnd(); if (c == '\r') skipLF = true; continue; }
      if (afterQuote) throw std::runtime_error("text-after-csv-quote");
      if (c == '"') {
        if (started || !fields[column].empty()) throw std::runtime_error("quote-in-unquoted-csv-field");
        quoted = true; started = true;
      } else { append(c); started = true; }
    }
  }
  void finish() {
    if (quoted) throw std::runtime_error("truncated-quoted-csv-record");
    if (column || started || afterQuote || !fields[0].empty()) recordEnd();
    if (!header) throw std::runtime_error("missing-csv-header");
    std::cout << "{\"type\":\"stats\",\"csvComplete\":true,\"rows\":" << rows
              << ",\"candidateRows\":" << candidates << ",\"repeatedHeaders\":" << repeats
              << ",\"blankRecords\":" << blank << ",\"uncompressedBytes\":" << bytes
              << ",\"oversizedHttpFields\":" << oversizedHttp << ",\"oversizedNonHttpFields\":" << oversizedOther
              << ",\"unclassifiedCandidateRows\":" << unclassified << "}" << std::endl;
  }
};
} // namespace

int main() {
  std::ios::sync_with_stdio(false);
  std::cin.tie(nullptr);
  try {
    Csv scanner;
    std::array<char, 1048576> buffer;
    while (std::cin) {
      std::cin.read(buffer.data(), buffer.size());
      if (std::cin.gcount()) scanner.feed(buffer.data(), static_cast<std::size_t>(std::cin.gcount()));
    }
    if (!std::cin.eof()) throw std::runtime_error("stdin-read-failure");
    scanner.finish();
    return 0;
  } catch (const std::exception& error) {
    // Only fixed parser codes, never a remote record/URL/anchor or source text.
    std::cout << "{\"type\":\"error\",\"code\":" << json(error.what()) << "}" << std::endl;
    return 2;
  }
}
