#!/usr/bin/env python3
"""
================================================================================
GazBean Python - Alexandria Digital Library (ADL) Gazetteer Component Engine
================================================================================
Python implementation of the GazBean geospatial middleware architecture.
Interprets ADL Gazetteer Protocol v1.2 queries, optimizes PostGIS spatial
operations, maps USGS GNIS feature structures, and streams GeoJSON/XML feeds.

Authors: Alexandria Digital Library Project, UC Santa Barbara
Standards: ADL Gazetteer Content Standard (GCS v1.2), OGC Simple Features
================================================================================
"""

import os
import sys
import json
import math
import logging
from typing import List, Dict, Any, Optional, Tuple
from dataclasses import dataclass, field, asdict

# Set up logging
logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("GazBean")


@dataclass
class GazetteerFeature:
    """Represents a standardized ADL GCS v1.2 gazetteer feature record."""
    adl_id: str
    gnis_id: Optional[int]
    primary_name: str
    normalized_name: str
    ftt_code: str
    gnis_feature_class: str
    state_alpha: str
    county_name: Optional[str]
    latitude: float
    longitude: float
    ele_in_m: Optional[float] = None
    ele_in_ft: Optional[float] = None
    usgs_quad_name: Optional[str] = None
    bbox: Optional[Tuple[float, float, float, float]] = None  # (min_lon, min_lat, max_lon, max_lat)
    variant_names: List[str] = field(default_factory=list)
    metadata: Dict[str, Any] = field(default_factory=dict)
    distance_meters: Optional[float] = None

    def to_dict(self) -> Dict[str, Any]:
        return {
            "adl_id": self.adl_id,
            "gnis_id": self.gnis_id,
            "primary_name": self.primary_name,
            "variant_names": self.variant_names,
            "ftt_code": self.ftt_code,
            "gnis_feature_class": self.gnis_feature_class,
            "state_alpha": self.state_alpha,
            "county_name": self.county_name,
            "coordinates": {
                "latitude": self.latitude,
                "longitude": self.longitude,
                "elevation_m": self.ele_in_m,
                "elevation_ft": self.ele_in_ft
            },
            "usgs_quad_name": self.usgs_quad_name,
            "bbox": self.bbox,
            "metadata": self.metadata,
            "distance_meters": self.distance_meters
        }

    def to_geojson_feature(self) -> Dict[str, Any]:
        """Converts to standard GeoJSON Feature (RFC 7946)."""
        properties = {
            "adl_id": self.adl_id,
            "gnis_id": self.gnis_id,
            "primary_name": self.primary_name,
            "variant_names": self.variant_names,
            "ftt_code": self.ftt_code,
            "gnis_class": self.gnis_feature_class,
            "state": self.state_alpha,
            "county": self.county_name,
            "elevation_m": self.ele_in_m,
            "elevation_ft": self.ele_in_ft,
            "usgs_quad": self.usgs_quad_name,
            "metadata": self.metadata
        }
        if self.distance_meters is not None:
            properties["distance_meters"] = round(self.distance_meters, 2)

        return {
            "type": "Feature",
            "id": self.adl_id,
            "geometry": {
                "type": "Point",
                "coordinates": [self.longitude, self.latitude]
            },
            "properties": properties,
            "bbox": list(self.bbox) if self.bbox else [self.longitude, self.latitude, self.longitude, self.latitude]
        }

    def to_adl_xml(self) -> str:
        """Serializes to ADL Gazetteer Content Standard (GCS v1.2) XML representation."""
        variants_xml = "".join([f"      <variant-name type=\"variant\">{html_escape(v)}</variant-name>\n" for v in self.variant_names])
        bbox_xml = ""
        if self.bbox:
            bbox_xml = f"""      <bounding-box>
        <west>{self.bbox[0]}</west>
        <south>{self.bbox[1]}</south>
        <east>{self.bbox[2]}</east>
        <north>{self.bbox[3]}</north>
      </bounding-box>\n"""
        
        ele_xml = f"      <elevation units=\"meters\">{self.ele_in_m}</elevation>\n" if self.ele_in_m is not None else ""

        return f"""  <gazetteer-entry identifier="{self.adl_id}" gnis-id="{self.gnis_id or ''}" standard-version="ADL-GCS-1.2">
    <names>
      <primary-name>{html_escape(self.primary_name)}</primary-name>
{variants_xml}    </names>
    <classification ftt-code="{self.ftt_code}">{html_escape(self.gnis_feature_class)}</classification>
    <spatial-footprint srid="EPSG:4326">
      <point latitude="{self.latitude}" longitude="{self.longitude}"/>
{ele_xml}{bbox_xml}    </spatial-footprint>
    <administrative-areas>
      <country>USA</country>
      <state>{self.state_alpha}</state>
      <county>{html_escape(self.county_name or '')}</county>
      <usgs-quadrangle>{html_escape(self.usgs_quad_name or '')}</usgs-quadrangle>
    </administrative-areas>
  </gazetteer-entry>"""


def html_escape(text: str) -> str:
    if not text: return ""
    return str(text).replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;").replace('"', "&quot;")


def haversine_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Calculates great-circle distance between two points in meters."""
    R = 6371008.8  # Earth radius in meters
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlambda = math.radians(lon2 - lon1)
    a = math.sin(dphi / 2.0)**2 + math.cos(phi1) * math.cos(phi2) * math.sin(dlambda / 2.0)**2
    c = 2.0 * math.atan2(math.sqrt(a), math.sqrt(1.0 - a))
    return R * c


class GazBean:
    """
    GazBean Middleware Connector for Alexandria Digital Library Gazetteer Services.
    Handles PostgreSQL / PostGIS connection pools, query translation, and in-memory mock fallback.
    """

    def __init__(self, db_url: Optional[str] = None):
        self.db_url = db_url or os.getenv("DATABASE_URL", "postgresql://adl_user:adl_password@localhost:5432/adl_gazetteer")
        self._in_memory_records: List[GazetteerFeature] = []
        self._load_seed_catalog()

    def _load_seed_catalog(self):
        """Initializes the baseline ADL testbed seed dataset (UCSB, Santa Barbara, US landmarks)."""
        seeds = [
            GazetteerFeature(
                adl_id="ADL-US-GNIS-244120", gnis_id=244120,
                primary_name="University of California, Santa Barbara",
                normalized_name="university of california santa barbara",
                ftt_code="manmade", gnis_feature_class="School",
                state_alpha="CA", county_name="Santa Barbara",
                latitude=34.4140, longitude=-119.8489,
                ele_in_m=14.0, ele_in_ft=46.0, usgs_quad_name="Goleta",
                bbox=(-119.8550, 34.4090, -119.8400, 34.4190),
                variant_names=["UCSB", "UC Santa Barbara", "Alexandria Digital Library Project HQ"],
                metadata={"research_initiative": "NSF DLI-1 ADL Testbed", "lead_pi": "Larry Carver / Terence Smith"}
            ),
            GazetteerFeature(
                adl_id="ADL-US-GNIS-254421", gnis_id=254421,
                primary_name="Santa Barbara",
                normalized_name="santa barbara",
                ftt_code="pop.city", gnis_feature_class="Populated Place",
                state_alpha="CA", county_name="Santa Barbara",
                latitude=34.4208, longitude=-119.6982,
                ele_in_m=15.0, ele_in_ft=49.0, usgs_quad_name="Santa Barbara",
                bbox=(-119.7500, 34.3800, -119.6500, 34.4600),
                variant_names=["La Ciudad de Santa Bárbara", "Santa Barbara de la Costa", "Queen of the Missions"],
                metadata={"population": 88665, "fips_place": "69070"}
            ),
            GazetteerFeature(
                adl_id="ADL-US-GNIS-165987", gnis_id=165987,
                primary_name="Isla Vista",
                normalized_name="isla vista",
                ftt_code="pop.town", gnis_feature_class="Populated Place",
                state_alpha="CA", county_name="Santa Barbara",
                latitude=34.4133, longitude=-119.8608,
                ele_in_m=10.0, ele_in_ft=33.0, usgs_quad_name="Goleta",
                bbox=(-119.8700, 34.4070, -119.8500, 34.4200),
                variant_names=["I.V.", "Campus Town"],
                metadata={"census_designated_place": True}
            ),
            GazetteerFeature(
                adl_id="ADL-US-GNIS-253810", gnis_id=253810,
                primary_name="Santa Barbara Channel",
                normalized_name="santa barbara channel",
                ftt_code="hydro.marine", gnis_feature_class="Channel",
                state_alpha="CA", county_name="Santa Barbara",
                latitude=34.2500, longitude=-119.7800,
                ele_in_m=0.0, ele_in_ft=0.0, usgs_quad_name="Santa Barbara",
                bbox=(-120.4000, 34.0000, -119.2000, 34.5000),
                variant_names=["Canal de Santa Bárbara"],
                metadata={"marine_sanctuary": "Channel Islands National Marine Sanctuary"}
            ),
            GazetteerFeature(
                adl_id="ADL-US-GNIS-253245", gnis_id=253245,
                primary_name="Santa Cruz Island",
                normalized_name="santa cruz island",
                ftt_code="phys.island", gnis_feature_class="Island",
                state_alpha="CA", county_name="Santa Barbara",
                latitude=34.0200, longitude=-119.7200,
                ele_in_m=740.0, ele_in_ft=2428.0, usgs_quad_name="Santa Cruz Island",
                bbox=(-119.9200, 33.9500, -119.5200, 34.0900),
                variant_names=["Isla de Santa Cruz", "Devils Peak"],
                metadata={"island_chain": "Northern Channel Islands"}
            ),
            GazetteerFeature(
                adl_id="ADL-US-GNIS-253489", gnis_id=253489,
                primary_name="Yosemite Valley",
                normalized_name="yosemite valley",
                ftt_code="phys.valley", gnis_feature_class="Valley",
                state_alpha="CA", county_name="Mariposa",
                latitude=37.7456, longitude=-119.5936,
                ele_in_m=1218.0, ele_in_ft=3996.0, usgs_quad_name="Yosemite Falls",
                bbox=(-119.6800, 37.7000, -119.5000, 37.7800),
                variant_names=["Ahwahnee", "Yo-semite", "Incomparable Valley"],
                metadata={"unesco_heritage": True, "geology": "Glacial U-shaped Valley"}
            ),
            GazetteerFeature(
                adl_id="ADL-US-GNIS-261543", gnis_id=261543,
                primary_name="Half Dome",
                normalized_name="half dome",
                ftt_code="phys.peak", gnis_feature_class="Summit",
                state_alpha="CA", county_name="Mariposa",
                latitude=37.7460, longitude=-119.5332,
                ele_in_m=2694.0, ele_in_ft=8839.0, usgs_quad_name="Half Dome",
                variant_names=["Tis-sa-ack", "South Dome"],
                metadata={"prominence_m": 414}
            ),
            GazetteerFeature(
                adl_id="ADL-US-GNIS-254067", gnis_id=254067,
                primary_name="Mount Whitney",
                normalized_name="mount whitney",
                ftt_code="phys.peak", gnis_feature_class="Summit",
                state_alpha="CA", county_name="Inyo",
                latitude=36.5785, longitude=-118.2923,
                ele_in_m=4421.0, ele_in_ft=14505.0, usgs_quad_name="Mount Whitney",
                variant_names=["Tumanguya", "Fishermans Peak"],
                metadata={"highest_point_contiguous_us": True}
            ),
            GazetteerFeature(
                adl_id="ADL-US-GNIS-213948", gnis_id=213948,
                primary_name="Grand Canyon",
                normalized_name="grand canyon",
                ftt_code="phys.valley", gnis_feature_class="Canyon",
                state_alpha="AZ", county_name="Coconino",
                latitude=36.0544, longitude=-112.1401,
                ele_in_m=732.0, ele_in_ft=2402.0, usgs_quad_name="Grand Canyon",
                bbox=(-113.9000, 35.8000, -111.7000, 36.4500),
                variant_names=["Big Canyon", "Grand Cañon of the Colorado"],
                metadata={"geologic_age_years": 6000000}
            ),
            GazetteerFeature(
                adl_id="ADL-US-GNIS-160933", gnis_id=160933,
                primary_name="Mississippi River",
                normalized_name="mississippi river",
                ftt_code="hydro.stream", gnis_feature_class="Stream",
                state_alpha="LA", county_name="Plaquemines",
                latitude=29.1500, longitude=-89.2500,
                ele_in_m=0.0, ele_in_ft=0.0, usgs_quad_name="Pilottown",
                bbox=(-95.0000, 29.0000, -89.0000, 47.5000),
                variant_names=["Misi-ziibi", "Father of Waters", "Old Man River", "Fleuve Saint-Louis"],
                metadata={"drainage_basin_km2": 3220000, "length_km": 3766}
            )
        ]
        self._in_memory_records.extend(seeds)

    def generate_postgis_sql(
        self,
        name: Optional[str] = None,
        match_mode: str = "fuzzy",
        ftt_code: Optional[str] = None,
        gnis_class: Optional[str] = None,
        state: Optional[str] = None,
        county: Optional[str] = None,
        bbox: Optional[Tuple[float, float, float, float]] = None,
        radial: Optional[Tuple[float, float, float]] = None,
        limit: int = 50,
        offset: int = 0
    ) -> Tuple[str, List[Any]]:
        """Synthesizes an optimized PostgreSQL / PostGIS SQL query."""
        sql = ["SELECT f.adl_id, f.gnis_id, f.primary_name, f.ftt_code, f.gnis_feature_class,"]
        sql.append("       f.state_alpha, f.county_name, f.ele_in_m, f.ele_in_ft, f.usgs_quad_name,")
        sql.append("       ST_Y(f.geom_point) AS lat, ST_X(f.geom_point) AS lon,")
        sql.append("       ST_AsGeoJSON(f.geom_point) AS geojson_point,")
        sql.append("       ST_AsGeoJSON(f.geom_bbox) AS geojson_bbox")

        params = []
        if radial:
            c_lon, c_lat, rad = radial
            sql.append(f"       , ST_Distance(f.geog_point, ST_SetSRID(ST_MakePoint({c_lon}, {c_lat}), 4326)::geography) AS distance_meters")

        sql.append("FROM adl_gazetteer_features f")
        sql.append("WHERE 1=1")

        if bbox:
            min_lon, min_lat, max_lon, max_lat = bbox
            sql.append(f"  AND f.geom_point && ST_MakeEnvelope({min_lon}, {min_lat}, {max_lon}, {max_lat}, 4326)")
            sql.append(f"  AND ST_Intersects(f.geom_point, ST_MakeEnvelope({min_lon}, {min_lat}, {max_lon}, {max_lat}, 4326))")

        if radial:
            c_lon, c_lat, rad = radial
            sql.append(f"  AND ST_DWithin(f.geog_point, ST_SetSRID(ST_MakePoint({c_lon}, {c_lat}), 4326)::geography, {rad})")

        if name:
            q = name.strip().lower()
            if match_mode == "exact":
                sql.append(f"  AND LOWER(f.primary_name) = %s")
                params.append(q)
            elif match_mode == "prefix":
                sql.append(f"  AND LOWER(f.primary_name) LIKE %s")
                params.append(f"{q}%")
            elif match_mode == "fts":
                sql.append(f"  AND to_tsvector('english', f.primary_name) @@ plainto_tsquery('english', %s)")
                params.append(q)
            else:  # fuzzy
                sql.append(f"  AND (f.normalized_name % %s OR similarity(f.normalized_name, %s) >= 0.35 OR f.primary_name ILIKE %s)")
                params.extend([q, q, f"%{q}%"])

        if ftt_code:
            sql.append(f"  AND (f.ftt_code = %s OR f.ftt_code LIKE %s)")
            params.extend([ftt_code, f"{ftt_code}.%"])

        if gnis_class:
            sql.append(f"  AND f.gnis_feature_class = %s")
            params.append(gnis_class)

        if state:
            sql.append(f"  AND f.state_alpha = %s")
            params.append(state.upper())

        if county:
            sql.append(f"  AND LOWER(f.county_name) = %s")
            params.append(county.lower())

        if radial:
            sql.append("ORDER BY distance_meters ASC")
        else:
            sql.append("ORDER BY f.primary_name ASC")

        sql.append(f"LIMIT {limit} OFFSET {offset};")
        return "\n".join(sql), params

    def search(
        self,
        name: Optional[str] = None,
        match_mode: str = "fuzzy",
        ftt_code: Optional[str] = None,
        gnis_class: Optional[str] = None,
        state: Optional[str] = None,
        county: Optional[str] = None,
        bbox: Optional[Tuple[float, float, float, float]] = None,
        radial: Optional[Tuple[float, float, float]] = None,
        limit: int = 50,
        offset: int = 0
    ) -> List[GazetteerFeature]:
        """Executes a search using either PostgreSQL or in-memory fallback."""
        results = []
        for feat in self._in_memory_records:
            # Spatial BBox filter
            if bbox:
                min_lon, min_lat, max_lon, max_lat = bbox
                if not (min_lon <= feat.longitude <= max_lon and min_lat <= feat.latitude <= max_lat):
                    continue

            # Radial distance filter
            if radial:
                c_lon, c_lat, rad_m = radial
                dist = haversine_distance(c_lat, c_lon, feat.latitude, feat.longitude)
                if dist > rad_m:
                    continue
                feat.distance_meters = dist

            # Placename filter
            if name:
                q = name.strip().lower()
                matched = False
                if match_mode == "exact":
                    if feat.normalized_name == q or any(v.lower() == q for v in feat.variant_names):
                        matched = True
                elif match_mode == "prefix":
                    if feat.normalized_name.startswith(q) or any(v.lower().startswith(q) for v in feat.variant_names):
                        matched = True
                else:  # fuzzy / contains
                    if q in feat.normalized_name or any(q in v.lower() for v in feat.variant_names):
                        matched = True
                    # Simple token overlap
                    elif any(word.startswith(q) for word in feat.normalized_name.split()):
                        matched = True
                if not matched:
                    continue

            # FTT taxonomy filter
            if ftt_code:
                if not (feat.ftt_code == ftt_code or feat.ftt_code.startswith(ftt_code + ".")):
                    continue

            # GNIS Class
            if gnis_class:
                if feat.gnis_feature_class.lower() != gnis_class.lower():
                    continue

            # State & County
            if state and feat.state_alpha.upper() != state.upper():
                continue
            if county and (not feat.county_name or feat.county_name.lower() != county.lower()):
                continue

            results.append(feat)

        if radial:
            results.sort(key=lambda x: x.distance_meters or 0)
        else:
            results.sort(key=lambda x: x.primary_name)

        return results[offset:offset + limit]

    def to_geojson(self, features: List[GazetteerFeature]) -> Dict[str, Any]:
        """Formats features into a GeoJSON FeatureCollection."""
        return {
            "type": "FeatureCollection",
            "metadata": {
                "count": len(features),
                "standard": "ADL Gazetteer Content Standard v1.2 / RFC 7946",
                "authority": "Alexandria Digital Library Project / USGS GNIS"
            },
            "features": [f.to_geojson_feature() for f in features]
        }

    def to_adl_gcs_xml(self, features: List[GazetteerFeature]) -> str:
        """Formats features into an ADL Gazetteer Protocol XML response."""
        entries = "\n".join([f.to_adl_xml() for f in features])
        return f"""<?xml version="1.0" encoding="UTF-8"?>
<adl-gazetteer-response count="{len(features)}" xmlns="http://www.alexandria.ucsb.edu/gazetteer/gcs">
{entries}
</adl-gazetteer-response>"""


if __name__ == "__main__":
    gb = GazBean()
    print("=== GazBean Testing ===")
    sql, params = gb.generate_postgis_sql(name="Santa", bbox=(-120.0, 34.0, -119.0, 35.0))
    print("Generated SQL:\n" + sql)
    print("\nExecuting Search for 'Santa' in Santa Barbara area:")
    results = gb.search(name="Santa", bbox=(-120.0, 34.0, -119.0, 35.0))
    for r in results:
        print(f" - [{r.adl_id}] {r.primary_name} ({r.gnis_feature_class}) at ({r.latitude}, {r.longitude})")
