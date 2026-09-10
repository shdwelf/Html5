#!/usr/bin/env python3
"""
================================================================================
USGS GNIS to ADL PostgreSQL / PostGIS ETL Ingestion Pipeline
================================================================================
Extracts, transforms, and loads official USGS Geographic Names Information
System (GNIS) data files (pipe-delimited NationalFile_*.txt or CSV) into
the Alexandria Digital Library (ADL) PostgreSQL / PostGIS schema.

Conforms to: ADL Gazetteer Content Standard (GCS v1.2)
================================================================================
"""

import os
import sys
import csv
import json
import argparse
import io
from typing import Dict, List, Optional, Any, Iterator

# Feature Class mapping from USGS GNIS to ADL Feature Type Thesaurus (FTT)
GNIS_TO_ADL_FTT_MAP: Dict[str, str] = {
    "summit": "phys.peak",
    "pillar": "phys.peak",
    "ridge": "phys.range",
    "range": "phys.range",
    "valley": "phys.valley",
    "canyon": "phys.valley",
    "gulch": "phys.valley",
    "arroyo": "phys.valley",
    "basin": "phys.valley",
    "cliff": "phys",
    "island": "phys.island",
    "bar": "phys.island",
    "reef": "phys.island",
    "cape": "phys",
    "beach": "phys",
    "stream": "hydro.stream",
    "river": "hydro.stream",
    "creek": "hydro.stream",
    "brook": "hydro.stream",
    "lake": "hydro.lake",
    "pond": "hydro.lake",
    "reservoir": "hydro.lake",
    "bay": "hydro.marine",
    "channel": "hydro.marine",
    "sound": "hydro.marine",
    "harbor": "hydro.marine",
    "strait": "hydro.marine",
    "sea": "hydro.marine",
    "ocean": "hydro.marine",
    "spring": "hydro.spring",
    "well": "hydro.spring",
    "geyser": "hydro.spring",
    "falls": "hydro",
    "canal": "manmade.transport",
    "swamp": "hydro",
    "populated place": "pop.city",
    "locale": "pop.town",
    "census": "pop",
    "civil": "admin.civil",
    "park": "admin.park",
    "reserve": "admin.park",
    "forest": "admin.park",
    "military": "admin.military",
    "building": "manmade",
    "school": "manmade",
    "hospital": "manmade",
    "church": "manmade",
    "airport": "manmade.transport",
    "bridge": "manmade.transport",
    "crossing": "manmade.transport",
    "dam": "manmade",
    "tower": "manmade",
    "tunnel": "manmade.transport",
    "cemetery": "manmade",
    "post office": "manmade"
}


def normalize_placename(name: str) -> str:
    """Normalizes placename for fast fuzzy index lookup."""
    if not name:
        return ""
    return " ".join(name.lower().strip().split())


def map_gnis_to_adl_ftt(gnis_class: str) -> str:
    """Maps a USGS GNIS feature class to the closest ADL FTT hierarchical code."""
    if not gnis_class:
        return "phys"
    key = gnis_class.strip().lower()
    return GNIS_TO_ADL_FTT_MAP.get(key, "phys")


class GnisToAdlETL:
    """ETL processor for USGS GNIS gazetteer feeds."""

    def __init__(self, source_id: str = "USGS_GNIS"):
        self.source_id = source_id
        self.processed_count = 0
        self.error_count = 0

    def parse_gnis_line(self, row: Dict[str, str]) -> Optional[Dict[str, Any]]:
        """Transforms a raw USGS GNIS dictionary row into an ADL GCS record."""
        try:
            # Check mandatory fields
            gnis_id_raw = row.get("FEATURE_ID") or row.get("feature_id") or row.get("ID")
            feature_name = row.get("FEATURE_NAME") or row.get("feature_name") or row.get("NAME")
            feature_class = row.get("FEATURE_CLASS") or row.get("feature_class") or row.get("CLASS")
            state_alpha = row.get("STATE_ALPHA") or row.get("state_alpha") or row.get("STATE")
            
            if not gnis_id_raw or not feature_name:
                return None

            gnis_id = int(gnis_id_raw)
            adl_id = f"ADL-US-GNIS-{gnis_id}"
            
            # Extract Decimal Coordinates
            lat_str = row.get("PRIM_LAT_DEC") or row.get("prim_lat_dec") or row.get("LATITUDE")
            lon_str = row.get("PRIM_LONG_DEC") or row.get("prim_long_dec") or row.get("LONGITUDE")

            if not lat_str or not lon_str:
                return None

            lat = float(lat_str)
            lon = float(lon_str)

            # Validate WGS84 range
            if not (-90.0 <= lat <= 90.0 and -180.0 <= lon <= 180.0):
                return None

            # Elevation conversion
            ele_m_raw = row.get("ELEV_IN_M") or row.get("elev_in_m")
            ele_ft_raw = row.get("ELEV_IN_FT") or row.get("elev_in_ft")
            
            ele_m = float(ele_m_raw) if ele_m_raw and ele_m_raw.strip() else None
            ele_ft = float(ele_ft_raw) if ele_ft_raw and ele_ft_raw.strip() else None

            if ele_m is None and ele_ft is not None:
                ele_m = round(ele_ft * 0.3048, 2)
            elif ele_ft is None and ele_m is not None:
                ele_ft = round(ele_m / 0.3048, 2)

            ftt_code = map_gnis_to_adl_ftt(feature_class or "General")

            metadata = {
                "source_agency": "USGS / BGN",
                "county_numeric": row.get("COUNTY_NUMERIC", ""),
                "state_numeric": row.get("STATE_NUMERIC", ""),
                "bgn_date": row.get("BGN_DATE", ""),
                "entry_date": row.get("DATE_CREATED", "")
            }

            return {
                "adl_id": adl_id,
                "gnis_id": gnis_id,
                "primary_name": feature_name.strip(),
                "normalized_name": normalize_placename(feature_name),
                "source_id": self.source_id,
                "ftt_code": ftt_code,
                "gnis_feature_class": feature_class.strip() if feature_class else "Unknown",
                "state_alpha": state_alpha.strip().upper() if state_alpha else "US",
                "county_name": row.get("COUNTY_NAME", "").strip(),
                "ele_in_m": ele_m,
                "ele_in_ft": ele_ft,
                "usgs_quad_name": row.get("MAP_NAME", "").strip(),
                "lat": lat,
                "lon": lon,
                "metadata_json": json.dumps(metadata)
            }
        except Exception as e:
            self.error_count += 1
            return None

    def process_file(self, filepath: str, delimiter: str = "|") -> Iterator[Dict[str, Any]]:
        """Streams transformed ADL GCS records from a USGS GNIS file."""
        with open(filepath, "r", encoding="utf-8", errors="replace") as f:
            reader = csv.DictReader(f, delimiter=delimiter)
            for row in reader:
                record = self.parse_gnis_line(row)
                if record:
                    self.processed_count += 1
                    yield record

    def generate_sql_inserts(self, records: Iterator[Dict[str, Any]], batch_size: int = 100) -> Iterator[str]:
        """Generates SQL INSERT statements with PostGIS geometry constructors."""
        batch = []
        for r in records:
            batch.append(r)
            if len(batch) >= batch_size:
                yield self._format_insert_batch(batch)
                batch = []
        if batch:
            yield self._format_insert_batch(batch)

    def _format_insert_batch(self, batch: List[Dict[str, Any]]) -> str:
        values = []
        for r in batch:
            pname = r["primary_name"].replace("'", "''")
            norm_name = r["normalized_name"].replace("'", "''")
            county = r["county_name"].replace("'", "''")
            quad = r["usgs_quad_name"].replace("'", "''")
            ele_m_val = str(r["ele_in_m"]) if r["ele_in_m"] is not None else "NULL"
            ele_ft_val = str(r["ele_in_ft"]) if r["ele_in_ft"] is not None else "NULL"
            meta = r["metadata_json"].replace("'", "''")

            val = (
                f"('{r['adl_id']}', {r['gnis_id']}, '{pname}', '{norm_name}', "
                f"'{r['source_id']}', '{r['ftt_code']}', '{r['gnis_feature_class']}', "
                f"'{r['state_alpha']}', '{county}', {ele_m_val}, {ele_ft_val}, '{quad}', "
                f"ST_SetSRID(ST_MakePoint({r['lon']}, {r['lat']}), 4326), "
                f"'{meta}'::jsonb)"
            )
            values.append(val)

        sql = (
            "INSERT INTO adl_gazetteer_features ("
            "adl_id, gnis_id, primary_name, normalized_name, source_id, ftt_code, "
            "gnis_feature_class, state_alpha, county_name, ele_in_m, ele_in_ft, "
            "usgs_quad_name, geom_point, metadata_json) VALUES\n"
            + ",\n".join(values)
            + "\nON CONFLICT (adl_id) DO UPDATE SET updated_at = CURRENT_TIMESTAMP;"
        )
        return sql


if __name__ == "__main__":
    print("=== USGS GNIS to ADL PostGIS ETL Utility ===")
    sample_gnis_csv = """FEATURE_ID|FEATURE_NAME|FEATURE_CLASS|STATE_ALPHA|STATE_NUMERIC|COUNTY_NAME|COUNTY_NUMERIC|PRIMARY_LAT_DMS|PRIM_LONG_DMS|PRIM_LAT_DEC|PRIM_LONG_DEC|ELEV_IN_M|ELEV_IN_FT|MAP_NAME
244120|University of California, Santa Barbara|School|CA|06|Santa Barbara|083|342450N|1195056W|34.4140|-119.8489|14|46|Goleta
254421|Santa Barbara|Populated Place|CA|06|Santa Barbara|083|342515N|1194153W|34.4208|-119.6982|15|49|Santa Barbara
253489|Yosemite Valley|Valley|CA|06|Mariposa|043|374444N|1193537W|37.7456|-119.5936|1218|3996|Yosemite Falls"""

    etl = GnisToAdlETL()
    reader = csv.DictReader(io.StringIO(sample_gnis_csv), delimiter="|")
    records = [etl.parse_gnis_line(r) for r in reader if r]
    records = [r for r in records if r]
    
    print(f"Parsed {len(records)} sample GNIS records into ADL GCS format.")
    for sql in etl.generate_sql_inserts(records):
        print("\nGenerated PostGIS SQL Batch:\n" + sql[:400] + "...\n")
