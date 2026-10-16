#!/usr/bin/env python3
"""Validate with the pinned upstream 0.11 schema, resolving its XML import offline."""
from pathlib import Path
import sys
try:
    from lxml import etree
except ImportError:
    sys.exit('Install the optional validator: python3 -m pip install lxml')

if len(sys.argv) != 2:
    sys.exit('Usage: python3 tools/wiki-workspace/validate-mediawiki.py export.xml')
base = Path(__file__).resolve().parent / 'schema'

class LocalSchema(etree.Resolver):
    def resolve(self, url, public_id, context):
        if url in ('http://www.w3.org/2001/xml.xsd', 'https://www.w3.org/2001/xml.xsd'):
            return self.resolve_filename(str(base / 'xml.xsd'), context)
        if url.startswith(('https://', 'http://')):
            raise ValueError('Network schema loading is disabled')
        return None

parser = etree.XMLParser(no_network=True, resolve_entities=False)
parser.resolvers.add(LocalSchema())
schema = etree.XMLSchema(etree.parse(str(base / 'export-0.11.xsd'), parser))
document = etree.parse(sys.argv[1], parser)
schema.assertValid(document)
print(f'MediaWiki export-0.11 schema validation passed: {sys.argv[1]}')
