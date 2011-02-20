#  Copyright (C) 2011  Stanislav Sinyagin
#
#  This program is free software; you can redistribute it and/or modify
#  it under the terms of the GNU General Public License as published by
#  the Free Software Foundation; either version 2 of the License, or
#  (at your option) any later version.
#
#  This program is distributed in the hope that it will be useful,
#  but WITHOUT ANY WARRANTY; without even the implied warranty of
#  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
#  GNU General Public License for more details.
#
#  You should have received a copy of the GNU General Public License
#  along with this program; if not, write to the Free Software
#  Foundation, Inc., 59 Temple Place, Suite 330, Boston, MA 02111-1307, USA.

#

SUBST = @abs_top_builddir@/setup_tools/substvars.sh

# Qooxdo application generator and sources

noinst_SCRIPTS = \
	generate.py

noinst_DATA = \
	config.json \
	source/index.html


CLEANFILES = \
	generate.py \
	config.json \
	source/index.html

EXTRA_DIST = \
        generate.py.in \
	config.json.in \
	Manifest.json \
	source/index.html.in


generate.py: generate.py.in
	$(SUBST) generate.py.in > generate.py
	$(CHMOD) u+x generate.py

config.json: config.json.in
	$(SUBST) config.json.in > config.json

source/index.html: source/index.html.in
	$(SUBST) source/index.html.in > source/index.html

qx-source-all: generate.py
	$(PYTHON) generate.py source-all

qx-source: generate.py
	$(PYTHON) generate.py source

qx-build: generate.py
	$(PYTHON) generate.py build


# Qooxdo ready-to-deploy application in build/ goes as-is into target
# directory and into the distribution package

install-data-local: build
	cd build && find . -type d -print >../list.tmp
	for d in `cat list.tmp`; do \
	  $(mkinstalldirs) $(DESTDIR)$(frontenddir)/$$d; done
	cd build && find . -type f -print >../list.tmp
	for f in `cat list.tmp`; do \
	  $(INSTALL_DATA) build/$$f $(DESTDIR)$(frontenddir)/$$f; done; \
	rm -f list.tmp

uninstall-local: build
	find build -type d -print >list.tmp
	for d in `cat list.tmp`; do \
	  rm -r $(DESTDIR)$(frontenddir)/$$d; done
	rm -f list.tmp


dist-hook: build
	find build -type d -print >list.tmp
	for d in `cat list.tmp`; do \
	  mkdir $(distdir)/$$d; done
	find build -type f -print >list.tmp
	for f in `cat list.tmp`; do \
	  cp $$f $(distdir)/$$f; done
	rm -f list.tmp


