#!/usr/bin/env python3
"""Create a deploy-only ZIP, with index.html at the ZIP root. No source tools leak."""
from __future__ import annotations
import argparse
from pathlib import Path
import zipfile
from site_utils import ROOT,public_files
from set_site_url import check_site_url

def package_site(root:Path,output:Path) -> int:
    issues=check_site_url(root)
    if issues:raise ValueError('Run tools/set_site_url.py --check first:\n'+'\n'.join(issues))
    files=public_files(root)
    output=output.resolve()
    if output in [(root/name).resolve() for name in files]:
        raise ValueError('The output cannot overwrite a public site file.')
    output.parent.mkdir(parents=True,exist_ok=True)
    with zipfile.ZipFile(output,'w',compression=zipfile.ZIP_DEFLATED) as archive:
        for name in files:archive.write(root/name,arcname=name)
    return len(files)

def main():
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--output',type=Path,default=ROOT/'dist/site-publish.zip')
    args=parser.parse_args()
    try:count=package_site(ROOT,args.output)
    except (ValueError,OSError) as error:parser.exit(2,f'Packaging error: {error}\n')
    print(f'Packaged {count} public files: {args.output}')

if __name__=='__main__':main()
