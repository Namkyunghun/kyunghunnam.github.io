"""Shared public-file inventory and deployment URL validation; Python 3.10+."""
from __future__ import annotations
import json
from pathlib import Path
import re
from urllib.parse import urlsplit,urlunsplit

ROOT=Path(__file__).resolve().parents[1]
PUBLIC_TOP_LEVEL=(
    'index.html','404.html','research.html','publications.html','notes.html','contact.html',
    'styles.css','common.js','robots.txt','sitemap.xml','site.webmanifest',
    'favicon.svg','og-card.svg','.nojekyll',
)
# Explicit list, not a directory glob: unrelated later uploads are not published.
PUBLIC_ASSETS=(
    'assets/favicon.svg','assets/favicon-192.png','assets/favicon-512.png',
    'assets/apple-touch-icon.png','assets/og-card.svg','assets/og-card.png',
    'assets/papers/FOAM_ICML2026.pdf','assets/papers/foam.bib',
)

def normalize_url(value: str) -> str:
    """Accept an HTTPS website base, never credentials, query strings or fragments."""
    part=urlsplit(value.strip())
    if part.scheme!='https' or not part.hostname or part.username or part.password:
        raise ValueError('Use an HTTPS site URL without embedded credentials.')
    if part.query or part.fragment or '?' in value or '#' in value:
        raise ValueError('The site base must not contain a query or fragment.')
    if not re.fullmatch(r'[A-Za-z0-9.-]+(?::[0-9]+)?',part.netloc):
        raise ValueError('Use a valid ASCII hostname (punycode for international domains).')
    if part.port is not None and not (1<=part.port<=65535):
        raise ValueError('Invalid port.')
    path=part.path or '/'
    if not re.fullmatch(r'/[A-Za-z0-9._~/-]*',path) or '//' in path:
        raise ValueError('The base path must use simple URL-safe characters.')
    if any(segment in ('.','..') for segment in path.split('/')):
        raise ValueError('Relative path segments are not allowed.')
    return urlunsplit(('https',part.netloc.lower(),path.rstrip('/')+'/', '', ''))

def configured_url(root: Path=ROOT) -> str:
    return normalize_url(json.loads((root/'site.config.json').read_text(encoding='utf-8'))['url'])

def public_files(root: Path=ROOT) -> list[str]:
    names=list(PUBLIC_TOP_LEVEL+PUBLIC_ASSETS)
    if (root/'CNAME').is_file(): names.append('CNAME')
    for name in names:
        path=root/name
        if path.is_symlink() or not path.is_file():
            raise FileNotFoundError(f'Missing or unsafe public file: {name}')
    return sorted(names)
