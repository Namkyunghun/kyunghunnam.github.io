#!/usr/bin/env python3
"""Loopback-only preview by default, including project-path and true 404 routing.

Not a production web server. Only the same allowlisted files as the publish ZIP
are served. The homepage is available at both / and the configured project path.
"""
from __future__ import annotations
import argparse
from functools import partial
from http.server import BaseHTTPRequestHandler,ThreadingHTTPServer
import mimetypes
from pathlib import Path
import re
import threading
from urllib.parse import unquote,urlsplit
from site_utils import ROOT,configured_url,public_files

class SiteHandler(BaseHTTPRequestHandler):
    def __init__(self,*args,root:Path,**kwargs):
        self.root=root
        self.prefix=urlsplit(configured_url(root)).path
        self.allowed=set(public_files(root))
        super().__init__(*args,**kwargs)
    def log_message(self,*args): pass
    def do_GET(self): self.respond(head=False)
    def do_HEAD(self): self.respond(head=True)
    def respond(self,head:bool):
        raw=unquote(urlsplit(self.path).path)
        project=self.prefix!='/' and raw.startswith(self.prefix)
        prefix=self.prefix if project else '/'
        if self.prefix!='/' and raw==self.prefix.rstrip('/'):
            self.send_response(308);self.send_header('Location',self.prefix)
            self.send_header('Content-Length','0');self.end_headers();return
        relative=raw[len(prefix):] if raw.startswith(prefix) else raw.lstrip('/')
        relative=relative or 'index.html'
        safe='\\' not in relative and '\x00' not in relative and all(p not in ('.','..') for p in relative.split('/'))
        status=200 if safe and relative in self.allowed else 404
        path=self.root/(relative if status==200 else '404.html')
        body=path.read_bytes()
        if status==404:
            # Root alias and configured-prefix preview both resolve nested assets.
            text=body.decode('utf-8')
            for attribute in ('href','src'):
                text=text.replace(f'{attribute}="{self.prefix}',f'{attribute}="{prefix}')
            body=text.encode('utf-8')
        suffix=path.suffix
        mime={'.webmanifest':'application/manifest+json','.bib':'application/x-bibtex',
              '.js':'text/javascript'}.get(suffix) or mimetypes.guess_type(path.name)[0] or 'application/octet-stream'
        if mime.startswith('text/') or suffix in ('.webmanifest','.bib','.svg'):mime+='; charset=utf-8'
        self.send_response(status)
        self.send_header('Content-Type',mime)
        self.send_header('Content-Length',str(len(body)))
        self.send_header('X-Content-Type-Options','nosniff')
        self.send_header('Cache-Control','no-store')
        self.end_headers()
        if not head:self.wfile.write(body)

def start_server(root:Path=ROOT,port:int=8000,bind:str='127.0.0.1'):
    """Return (server, background thread); callers must shutdown and close."""
    public_files(root)  # Fail before opening the port if a release asset is missing.
    server=ThreadingHTTPServer((bind,port),partial(SiteHandler,root=root))
    thread=threading.Thread(target=server.serve_forever,daemon=True)
    thread.start()
    return server,thread

def main():
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--port',type=int,default=8000)
    parser.add_argument('--bind',default='127.0.0.1',help='Default is local-only; use 0.0.0.0 deliberately for LAN preview')
    args=parser.parse_args()
    try:
        server,thread=start_server(port=args.port,bind=args.bind)
    except (OSError,ValueError) as error:parser.exit(2,f'Preview error: {error}\n')
    print(f'Preview: http://{args.bind}:{server.server_port}{urlsplit(configured_url()).path}',flush=True)
    print('Ctrl+C to stop. This server is for local preview only.',flush=True)
    try:thread.join()
    except KeyboardInterrupt:pass
    finally:server.shutdown();server.server_close()

if __name__=='__main__':main()
