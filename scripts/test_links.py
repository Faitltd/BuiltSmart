import os
import argparse
from html.parser import HTMLParser

DEFAULT_HTML_FILE = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'index.html')

class LinkParser(HTMLParser):
    def __init__(self, base_dir):
        super().__init__()
        self.base_dir = base_dir
        self.anchors = []
        self.resources = []
        self.ids = set()
        self._current_anchor = None

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if tag == 'a' and 'href' in attrs:
            self._current_anchor = {'href': attrs['href'], 'text': ''}
        elif tag in ('link', 'script', 'img'):
            attr = 'href' if tag == 'link' else 'src'
            if attr in attrs:
                url = attrs[attr]
                self.resources.append(url)
        if 'id' in attrs:
            self.ids.add(attrs['id'])

    def handle_data(self, data):
        if self._current_anchor is not None:
            self._current_anchor['text'] += data

    def handle_endtag(self, tag):
        if tag == 'a' and self._current_anchor is not None:
            self.anchors.append(self._current_anchor)
            self._current_anchor = None


def check_file(html_file):
    base_dir = os.path.dirname(os.path.abspath(html_file))
    parser = LinkParser(base_dir)
    with open(html_file, 'r', encoding='utf-8') as f:
        parser.feed(f.read())

    print('Anchor Links:')
    for a in parser.anchors:
        href = a['href']
        text = a['text'].strip() or '(no text)'
        status = 'REMOTE'
        if href.startswith('#'):
            target = href[1:]
            status = 'OK' if target in parser.ids else 'MISSING TARGET'
        elif not href.startswith(('http://', 'https://', '//')):
            target_path = os.path.join(base_dir, href)
            status = 'OK' if os.path.exists(target_path) else 'MISSING'
        print(f"  {text}: href='{href}' -> {status}")

    print('\nResources:')
    for url in parser.resources:
        if url.startswith(('http://', 'https://', '//')):
            print(f"  {url} -> REMOTE")
        else:
            abs_path = os.path.join(base_dir, url)
            status = 'OK' if os.path.exists(abs_path) else 'MISSING'
            print(f"  {url} -> {status}")


def main():
    argp = argparse.ArgumentParser(description='Check links and resources in an HTML file.')
    argp.add_argument('file', nargs='?', default=DEFAULT_HTML_FILE, help='HTML file to check')
    args = argp.parse_args()
    if not os.path.exists(args.file):
        raise SystemExit(f"File not found: {args.file}")
    check_file(args.file)


if __name__ == '__main__':
    main()
