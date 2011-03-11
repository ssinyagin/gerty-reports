#  Copyright (C) 2011  Stanislav Sinyagin
#
#  This program is free software; you can redistribute it and/or modify
#  it under the terms of the GNU General Public License as published by
#  the Free Software Foundation; either version 2 of the License, or
#  (at your option) any later version.
#
#  This program is distributed in the hope that it will be useful,
#  but WITHOUT ANY WARRANTY; without even the implied warranty of
#  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.	 See the
#  GNU General Public License for more details.
#
#  You should have received a copy of the GNU General Public License
#  along with this program; if not, write to the Free Software
#  Foundation, Inc., 59 Temple Place, Suite 330, Boston, MA 02111-1307, USA.

#

SUBST = @abs_top_builddir@/setup_tools/substvars.sh

scrpdir = @backenddir@/script

scrp_SCRIPTS = \
	script/gerty_reports

cfgdir = @backenddir@
nodist_cfg_DATA = gerty_reports.json

CLEANFILES = $(scrp_SCRIPTS) $(nodist_cfg_DATA)


EXTRA_DIST = \
	script/gerty_reports.in \
	gerty_reports.json.in \
	gerty_reports_siteconfig.json



script/gerty_reports: script/gerty_reports.in
	$(SUBST) script/gerty_reports.in > script/gerty_reports
	$(CHMOD) a+x script/gerty_reports


gerty_reports.json: gerty_reports.json.in
	$(SUBST) gerty_reports.json.in > gerty_reports.json



# Installer for all Perl modules in lib/ and also the site config

install-data-local:
	find lib -type d -print >list.tmp
	for d in `cat list.tmp`; do \
	  $(mkinstalldirs) $(DESTDIR)$(backenddir)/$$d; done
	find lib \( -name '*.pm' \) -type f -print >list.tmp
	for f in `cat list.tmp`; do \
	  $(INSTALL_DATA) $$f $(DESTDIR)$(backenddir)/$$f; done
	$(RM) -f list.tmp
	if test ! -e @backendsitecfg@; then \
	  $(INSTALL_DATA) gerty_reports_siteconfig.json @backendsitecfg@; fi


uninstall-local:
	find lib -type d -print >list.tmp
	for d in `cat list.tmp`; do \
	  $(RM) -r $(DESTDIR)$(backenddir)/$$d; done
	$(RM) -f list.tmp


dist-hook:
	find lib -type d -print >list.tmp
	for d in `cat list.tmp`; do \
	  mkdir $(distdir)/$$d; done
	find lib \( -name '*.pm' \) -type f -print >list.tmp
	for f in `cat list.tmp`; do \
	  cp $$f $(distdir)/$$f; done
	$(RM) -f list.tmp
