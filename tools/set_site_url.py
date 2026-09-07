#!/usr/bin/env python3
"""Synchronize canonical/OG/JSON-LD/robots/sitemap/404 URLs. No build needed."""
from __future__ import annotations
import argparse
import json
from pathlib import Path
import re
from urllib.parse import urlsplit
from site_utils import ROOT,configured_url,normalize_url

FILES=('index.html','404.html','research.html','publications.html','notes.html','contact.html','robots.txt','sitemap.xml')

def check_site_url(root: Path=ROOT) -> list[str]:
    base=configured_url(root)
    expected={
        'index.html':[
            f'<link rel="canonical" href="{base}">',
            f'<meta property="og:url" content="{base}">',
            f'"@id": "{base}#website"',f'"@id": "{base}#person"',
            f'"contentUrl": "{base}assets/papers/FOAM_ICML2026.pdf"',
            f'<meta property="og:image" content="{base}assets/og-card.png">',
            f'<meta name="twitter:image" content="{base}assets/og-card.png">',
        ],
        '404.html':[f'href="{urlsplit(base).path}styles.css"', f'src="{urlsplit(base).path}common.js"', f'href="{urlsplit(base).path}index.html"'],
        'robots.txt':[f'Sitemap: {base}sitemap.xml'],
        'sitemap.xml':[f'<loc>{base}</loc>'],
    }
    for name,fragment in [('research','research'),('publications','foam'),('notes','questions'),('contact','about')]:
        expected[name+'.html']=[f'<link rel="canonical" href="{base}#{fragment}">']
    issues=[]
    for name,needles in expected.items():
        text=(root/name).read_text(encoding='utf-8')
        for needle in needles:
            if needle not in text: issues.append(f'{name}: missing expected value {needle}')
    return issues

def update_site_url(root: Path,new_url: str) -> list[str]:
    new=normalize_url(new_url)
    old=configured_url(root)
    # Read and prepare every change before writing anything.
    pending={}
    for name in FILES:
        path=root/name
        text=path.read_text(encoding='utf-8').replace(old,new)
        if name=='404.html':
            text=re.sub(r'(href|src)="'+re.escape(urlsplit(old).path), lambda match: match[1]+'="'+urlsplit(new).path, text)
        pending[path]=text
    config=json.loads((root/'site.config.json').read_text(encoding='utf-8'))
    config['url']=new
    pending[root/'site.config.json']=json.dumps(config,indent=2)+'\n'
    changed=[]
    for path,text in pending.items():
        if text!=path.read_text(encoding='utf-8'):
            # Atomic replacement per file; review the resulting git diff as usual.
            temporary=path.with_name(path.name+'.tmp')
            temporary.write_text(text,encoding='utf-8')
            temporary.replace(path)
            changed.append(path.name)
    return changed

def main() -> int:
    parser=argparse.ArgumentParser(description=__doc__)
    group=parser.add_mutually_exclusive_group(required=True)
    group.add_argument('--url',help='New HTTPS website base; trailing slash is normalized')
    group.add_argument('--check',action='store_true',help='Check the ready-to-serve files against site.config.json')
    args=parser.parse_args()
    try:
        if args.url:
            changed=update_site_url(ROOT,args.url)
            print('Updated: '+(', '.join(changed) or 'already consistent'))
        problems=check_site_url(ROOT)
        if problems:
            print('\n'.join(problems))
            return 1
        print('Site URL is consistent: '+configured_url(ROOT))
        return 0
    except (ValueError,OSError,KeyError) as error:
        parser.exit(2,f'Configuration error: {error}\n')

if __name__=='__main__':raise SystemExit(main())
