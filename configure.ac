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


AC_INIT([gerty-reports],[1.0.0],[ssinyagin@k-open.com])
AC_PREREQ([2.59])
AC_CONFIG_AUX_DIR(conftools)
AC_CANONICAL_HOST
AM_INIT_AUTOMAKE(1.9)

AC_PATH_PROG(PERL, perl, no)
AC_PATH_PROG(PYTHON, python, no)
AC_PATH_PROG(SED, sed, no)
AC_PATH_PROG(RM, rm, no)
AC_PATH_PROG(CHMOD, chmod, no)


AC_ARG_ENABLE(pkgonly,
        [AC_HELP_STRING([--enable-pkgonly],
                        [Skip all checking])])
AC_SUBST(enable_pkgonly)

        
perllibdirs=
PERLOPTS=
AC_ARG_VAR(PERLINC,  [[] Additional space-separated Perl library paths])
if test ! -z "$PERLINC"; then
   for d in $PERLINC; do
       PERLOPTS="${PERLOPTS} -I${d}"
       perllibdirs=${perllibdirs}"\,\'"${d}"\'"
   done
fi

AC_SUBST(perllibdirs, [${perllibdirs}])


# Check the necessary Perl modules

if test "$enable_pkgonly" != yes; then

   for module in \
       'DBI' 'Mojolicious' 'MojoX::Dispatcher::Qooxdoo::Jsonrpc' 
   do
     AC_MSG_CHECKING([presence of $module])
     if ${PERL} ${PERLOPTS} -e 'use '$module 2>/dev/null; then
         AC_MSG_RESULT([Ok])
     else
         AC_MSG_ERROR([Perl cannot find $module]);
     fi
   done
fi

AC_ARG_WITH(qooxdoo-sdk,
        [AC_HELP_STRING(--with-qooxdoo-sdk=DIR,absolute path to Qooxdoo SDK)],
        [if test "$enable_pkgonly" != yes; then
           AC_MSG_CHECKING([validity of Qooxdoo SDK])
           if test ! -f ${with_qooxdoo_sdk}/tool/bin/generator.py; then
             AC_MSG_ERROR(
               [--with-qooxdoo-sdk does not point to a valid Qooxdoo SDK])
           fi
           AC_MSG_RESULT([Ok])
           AC_MSG_CHECKING([validity of PYTHON])
           if test ${PYTHON} = no -o ! -x ${PYTHON}; then
             AC_MSG_ERROR(
               [Qooxdoo SDK requires a valid Python interpreter])
           fi
           AC_MSG_RESULT([Ok])
         fi])

if test x"${with_qooxdoo_sdk}" != x; then
  use_qooxdoo_sdk=1
else
  use_qooxdoo_sdk=0
fi

AC_SUBST(QOOXDOO_SDK, [${with_qooxdoo_sdk}])
AC_SUBST(USE_QOOXDOO_SDK, [${use_qooxdoo_sdk}])


AC_ARG_WITH(qxdygraphs,
   [AC_HELP_STRING(--with-qxdygraphs=DIR,
      location of QxDyGraphs Manifest.json)])

if test x"${with_qxdygraphs}" != x; then
  qxdygraphs_location="${with_qxdygraphs}"
else
  qxdygraphs_location="contrib://QxDyGraphs/trunk/Manifest.json"
fi

AC_SUBST(QXDYGRAPHS_LOCATION, [${qxdygraphs_location}])


AC_ARG_VAR(frontenddir, [[PREFIX/frontend] Frontend directory])
if test -z "$frontenddir"; then
   frontenddir='${prefix}/frontend'; fi

AC_ARG_VAR(backenddir, [[PREFIX/backend] Backend directory])
if test -z "$backenddir"; then
   backenddir='${prefix}/backend'; fi

AC_ARG_VAR(backendurl, [[/gerty_reports/backend] Backend URL])
if test -z "$backendurl"; then
   backendurl='/gerty_reports/backend'; fi

AC_ARG_VAR(jsonrpcpath,
[[jsonrpc] JSON-RPC service path, appended to BACKENDURL])
if test -z "$jsonrpcpath"; then
   jsonrpcpath='jsonrpc'; fi

AC_ARG_VAR(backendsitecfg,
[[BACKENDDIR/gerty_reports_siteconfig.json] Site-cpecific configuration file])
if test -z "$backendsitecfg"; then
   backendsitecfg='${backenddir}/gerty_reports_siteconfig.json'; fi
   

AC_CONFIG_FILES([Makefile frontend/Makefile backend/Makefile])
AC_CONFIG_FILES([setup_tools/substvars.sh],[chmod +x setup_tools/substvars.sh])

AC_SUBST(VERSION)
AC_OUTPUT
