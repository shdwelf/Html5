#!/usr/bin/env python3
"""
================================================================================
Alexandria Digital Library (ADL) Gazetteer Protocol v1.2 Web Service
================================================================================
Implements the formal ADL Gazetteer Service Protocol (HTTP/REST interface)
developed at UC Santa Barbara. Provides standardized endpoints for:
- get-capabilities
- search-box (Bounding box spatial query)
- search-point (Point-radius proximity query)
- search-name (Placename matching: exact, prefix, fuzzy)
- describe (Feature metadata by ADL-ID / GNIS-ID)
- thesaurus (ADL Feature Type Thesaurus taxonomy)

Standards: ADL Gazetteer Content Standard (GCS v1.2)
================================================================================
"""

import os
import sys
import json
import urllib.parse
from http.server import HTTPServer, BaseHTTPRequestHandler
from typing import Dict, Any

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "../..")))
from src.gazbean.gazbean import GazBean, GazetteerFeature

gaz_engine = GazBean()


class AdlGazetteerHandler(BaseHTTPRequestHandler):
    """HTTP Request handler implementing the ADL Gazetteer Protocol v1.2."""

    def _send_response(self, content_type: str, body: str, status: int = 200):
        data = body.encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", content_type)
        self.send_header("Content-Length", str(len(data)))
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.end_headers()
        self.wfile.write(data)

    def do_OPTIONS(self):
        self._send_response("text/plain", "OK")

    def do_GET(self):
        parsed = urllib.parse.urlparse(self.path)
        params = urllib.parse.parse_qs(parsed.query)

        # Flatten single query params
        query_params = {k: v[0] for k, v in params.items()}
        op = query_params.get("op", "").lower()
        fmt = query_params.get("format", "json").lower()

        if parsed.path == "/health" or parsed.path == "/":
            if not op:
                op = "get-capabilities"

        if op == "get-capabilities":
            self.handle_get_capabilities(fmt)
        elif op == "search-box":
            self.handle_search_box(query_params, fmt)
        elif op == "search-point":
            self.handle_search_point(query_params, fmt)
        elif op == "search-name":
            self.handle_search_name(query_params, fmt)
        elif op == "describe":
            self.handle_describe(query_params, fmt)
        elif op == "thesaurus":
            self.handle_thesaurus(fmt)
        elif op == "sql-preview":
            self.handle_sql_preview(query_params)
        else:
            self._send_response(
                "application/json",
                json.dumps({
                    "error": "Unknown ADL Gazetteer operation",
                    "supported_ops": ["get-capabilities", "search-box", "search-point", "search-name", "describe", "thesaurus", "sql-preview"]
                }),
                400
            )

    def handle_get_capabilities(self, fmt: str):
        caps = {
            "service_name": "Alexandria Digital Library Gazetteer Protocol Service",
            "protocol_version": "1.2",
            "standard": "ADL Gazetteer Content Standard (ADL GCS v1.2)",
            "authority": "Alexandria Digital Library Project / UC Santa Barbara & USGS GNIS",
            "spatial_reference_systems": ["EPSG:4326 (WGS 84)", "EPSG:3857 (Web Mercator)"],
            "operations": [
                {"name": "search-box", "description": "Bounding box spatial intersection query"},
                {"name": "search-point", "description": "Point-radius geodesic distance query"},
                {"name": "search-name", "description": "Exact, prefix, and trigram fuzzy placename matching"},
                {"name": "describe", "description": "Full ADL GCS record retrieval by ID"},
                {"name": "thesaurus", "description": "ADL Feature Type Thesaurus (FTT) vocabulary"}
            ],
            "thesaurus": "ADL Feature Type Thesaurus (FTT v2.0)",
            "primary_dataset": "USGS Geographic Names Information System (GNIS) + NGA GNS"
        }
        if fmt == "xml":
            xml = f"""<?xml version="1.0" encoding="UTF-8"?>
<adl-capabilities version="1.2">
  <service-name>{caps['service_name']}</service-name>
  <standard>{caps['standard']}</standard>
  <authority>{caps['authority']}</authority>
  <srs>EPSG:4326</srs>
  <operations>
    <operation name="search-box"/>
    <operation name="search-point"/>
    <operation name="search-name"/>
    <operation name="describe"/>
    <operation name="thesaurus"/>
  </operations>
</adl-capabilities>"""
            self._send_response("application/xml", xml)
        else:
            self._send_response("application/json", json.dumps(caps, indent=2))

    def handle_search_box(self, params: Dict[str, str], fmt: str):
        try:
            min_lon = float(params.get("min-lon") or params.get("west", -180))
            min_lat = float(params.get("min-lat") or params.get("south", -90))
            max_lon = float(params.get("max-lon") or params.get("east", 180))
            max_lat = float(params.get("max-lat") or params.get("north", 90))
            ftt = params.get("ftt-code")
            name = params.get("name")
            limit = int(params.get("limit", 50))
            
            results = gaz_engine.search(
                name=name,
                ftt_code=ftt,
                bbox=(min_lon, min_lat, max_lon, max_lat),
                limit=limit
            )
            self._format_and_send(results, fmt)
        except Exception as e:
            self._send_response("application/json", json.dumps({"error": str(e)}), 400)

    def handle_search_point(self, params: Dict[str, str], fmt: str):
        try:
            lat = float(params.get("lat", 0))
            lon = float(params.get("lon", 0))
            radius = float(params.get("radius", 50000)) # meters
            ftt = params.get("ftt-code")
            limit = int(params.get("limit", 50))

            results = gaz_engine.search(
                ftt_code=ftt,
                radial=(lon, lat, radius),
                limit=limit
            )
            self._format_and_send(results, fmt)
        except Exception as e:
            self._send_response("application/json", json.dumps({"error": str(e)}), 400)

    def handle_search_name(self, params: Dict[str, str], fmt: str):
        name = params.get("name", "")
        mode = params.get("mode", "fuzzy")
        state = params.get("state")
        ftt = params.get("ftt-code")
        limit = int(params.get("limit", 50))

        results = gaz_engine.search(
            name=name,
            match_mode=mode,
            state=state,
            ftt_code=ftt,
            limit=limit
        )
        self._format_and_send(results, fmt)

    def handle_describe(self, params: Dict[str, str], fmt: str):
        identifier = params.get("id") or params.get("identifier")
        if not identifier:
            self._send_response("application/json", json.dumps({"error": "Missing parameter 'id'"}), 400)
            return

        match = None
        for f in gaz_engine.get_features() if hasattr(gaz_engine, "get_features") else gaz_engine._in_memory_records:
            if f.adl_id == identifier or str(f.gnis_id) == identifier:
                match = f
                break

        if not match:
            self._send_response("application/json", json.dumps({"error": f"Feature '{identifier}' not found"}), 404)
            return

        self._format_and_send([match], fmt)

    def handle_thesaurus(self, fmt: str):
        thesaurus_data = {
            "thesaurus": "ADL Feature Type Thesaurus (FTT)",
            "facets": [
                {"code": "phys", "name": "Physiographic Features", "children": ["phys.peak", "phys.valley", "phys.range", "phys.island"]},
                {"code": "hydro", "name": "Hydrographic Structures", "children": ["hydro.stream", "hydro.lake", "hydro.marine", "hydro.spring"]},
                {"code": "pop", "name": "Populated Places", "children": ["pop.city", "pop.town"]},
                {"code": "admin", "name": "Administrative Areas", "children": ["admin.park", "admin.civil", "admin.military"]},
                {"code": "manmade", "name": "Manmade Structures", "children": ["manmade.transport"]}
            ]
        }
        self._send_response("application/json", json.dumps(thesaurus_data, indent=2))

    def handle_sql_preview(self, params: Dict[str, str]):
        name = params.get("name")
        state = params.get("state")
        ftt = params.get("ftt-code")
        sql, bind_params = gaz_engine.generate_postgis_sql(name=name, state=state, ftt_code=ftt)
        self._send_response("application/json", json.dumps({"sql": sql, "parameters": bind_params}, indent=2))

    def _format_and_send(self, features, fmt: str):
        if fmt == "xml":
            xml = gaz_engine.to_adl_gcs_xml(features)
            self._send_response("application/xml", xml)
        elif fmt == "geojson":
            gj = gaz_engine.to_geojson(features)
            self._send_response("application/geo+json", json.dumps(gj, indent=2))
        else:
            data = [f.to_dict() for f in features]
            self._send_response("application/json", json.dumps({"count": len(data), "features": data}, indent=2))


def run_service(port: int = 8085):
    server = HTTPServer(("0.0.0.0", port), AdlGazetteerHandler)
    logger.info(f"ADL Gazetteer Protocol v1.2 Server listening on 0.0.0.0:{port}")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        logger.info("Stopping ADL server...")
        server.server_close()


if __name__ == "__main__":
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 8085
    run_service(port)
