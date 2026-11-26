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
constexpr std::size_t maximumField = 16384;
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

class Csv {
  std::array<std::string, 4> fields;
  std::size_t column = 0;
  bool quoted = false, afterQuote = false, escaped = false, started = false, skipLF = false;
  bool header = false;
  std::array<std::string, 4> schema;
  std::uint64_t rows = 0, candidates = 0, repeats = 0, blank = 0, bytes = 0;

  void append(char c) {
    // An anchor is never retained, even for a candidate. Its quoting still
    // participates in record framing, so embedded commas/newlines are safe.
    if (header && column == 3) return;
    if (fields[column].size() >= maximumField) throw std::runtime_error("url-or-header-field-limit");
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
      if (candidate(fields[1]) || candidate(fields[2])) {
        ++candidates;
        std::cout << "{\"type\":\"candidate\",\"row\":" << rows
                  << ",\"crawlDate\":" << json(fields[0]) << ",\"source\":" << json(fields[1])
                  << ",\"target\":" << json(fields[2]) << "}\n";
      }
      if (rows % 10000000 == 0) {
        std::cout << "{\"type\":\"progress\",\"rows\":" << rows << ",\"uncompressedBytes\":" << bytes << "}" << std::endl;
      }
    }
    for (auto& field : fields) field.clear();
    column = 0; started = false; afterQuote = false;
  }
public:
  void feed(const char* data, std::size_t length) {
    for (std::size_t index = 0; index < length; ++index) {
      const char c = data[index]; ++bytes;
      if (skipLF) { skipLF = false; if (c == '\n') continue; }
      if (quoted) {
        if (escaped) {
          escaped = false;
          if (c == '"' || c == '\\') { append(c); continue; }
          append('\\'); // Preserve a non-escape backslash.
        }
        if (c == '\\') escaped = true;
        else if (c == '"') { quoted = false; afterQuote = true; }
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
    if (quoted || escaped) throw std::runtime_error("truncated-quoted-csv-record");
    if (column || started || afterQuote || !fields[0].empty()) recordEnd();
    if (!header) throw std::runtime_error("missing-csv-header");
    std::cout << "{\"type\":\"stats\",\"csvComplete\":true,\"rows\":" << rows
              << ",\"candidateRows\":" << candidates << ",\"repeatedHeaders\":" << repeats
              << ",\"blankRecords\":" << blank << ",\"uncompressedBytes\":" << bytes << "}" << std::endl;
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
