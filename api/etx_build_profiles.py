"""Read ETX shell/Make metadata into explicit analysis profiles, never execute it."""
import hashlib
from pathlib import Path
import re
import shlex


def discover(roots):
    selected={root.path.name:root for root in roots}
    root=selected['etx_makebuild'];united=selected['etx_unitedbuild']
    script=united.path/'united_build.sh';configure=root.path/'configure';defines=root.path/'defines.mak'
    texts={p:p.read_text() for p in [script,configure,defines]}
    if 'source ./configure -b ETXA_BOARD_EVB' not in texts[script]:raise ValueError('Expected EVB configuration changed; review build metadata')
    if 'export CROSS_COMPILE=${TOOLCHAIN_ROOT}/arm-linux-gnueabihf-' not in texts[configure]:raise ValueError('Cross compiler metadata changed; review configure')
    sysroot=root.path.parent/'etx_nxp_build/build_lsdk2512/rfs/rootfs_lsdk2512_debian_ls1028ardb'
    evidence=[{'path':str(p),'sha256':hashlib.sha256(p.read_bytes()).hexdigest()} for p in texts]
    variables={'ETXA_DIR':str(root.path/'etxa'),'PROJECT_DIR':str(root.path),'USER_ETXA_PROJECTS':str(root.path.parent)}
    includes={};directory_evidence={};unresolved=[]
    # Read only selected Makefile metadata. No make, shell expansion or $(shell) calls.
    for makefile in sorted(root.path.rglob('Makefile')):
        if '.git' in makefile.parts or not makefile.resolve().is_relative_to(root.path.resolve()):continue
        text=makefile.read_text(errors='replace').replace('\\\n',' ')
        dirs=[]
        for line in text.splitlines():
            match=re.match(r'\s*(?:export\s+)?INC_DIR\s*[:+?]?=\s*(.*)',line)
            if not match:continue
            value=match[1].split('#',1)[0]
            for name,replacement in variables.items():
                value=value.replace('$('+name+')',replacement).replace('${'+name+'}',replacement)
            if '$' in value:
                unresolved.append(str(makefile.relative_to(root.path))+': dynamic INC_DIR expansion');continue
            try:tokens=shlex.split(value)
            except ValueError:unresolved.append(str(makefile.relative_to(root.path))+': malformed INC_DIR');continue
            i=0
            while i<len(tokens):
                token=tokens[i];i+=1
                if token=='-I' and i<len(tokens):directory=tokens[i];i+=1
                elif token.startswith('-I'):directory=token[2:]
                else:continue
                path=Path(directory);path=(makefile.parent/path).resolve() if not path.is_absolute() else path.resolve()
                if path.is_relative_to(root.path.resolve()):dirs.append(str(path.relative_to(root.path.resolve())))
                else:unresolved.append(str(makefile.relative_to(root.path))+': include outside selected root')
        relative=str(makefile.parent.relative_to(root.path))
        includes[relative]=list(dict.fromkeys(dirs))
        directory_evidence[relative]={"path":str(makefile),"sha256":hashlib.sha256(makefile.read_bytes()).hexdigest()}
    profiles=[]
    for name,value in [('entu_2i_10g',0),('entu_qi_edge',1)]:
        macro={'ETXA_BOARD_EVB':1,'_GNU_SOURCE':1}
        if name=='entu_qi_edge':macro['INCLUDE_RADOS_ROUTER_PACKAGE_LINUX']=1
        profiles.append({'id':'evb-'+name,'aliases':[name],'repository_id':root.id,'target':'arm-linux-gnueabihf',
          'build_compiler':'/bin/arm-linux-gnueabihf-gcc','standard':'gnu11','defines':macro,
          'sysroot':str(sysroot),'system_include_dirs':[str(sysroot/p) for p in ['usr/include/arm-linux-gnueabihf','usr/include','usr/include/libnl3','usr/lib/arm-linux-gnueabihf/include']],
          'include_dirs':['.','etxa'],'directory_includes':includes,'directory_evidence':directory_evidence,
          'macro_overrides':[{'file':'etxa/project/utils/features/features_ext.h','name':'DEVID_ETX2i_10G_B_8SFPP_L3','value':value}],
          'configuration_evidence':evidence,'completeness':'partial',
          'limitations':['Derived from shell defaults and literal INC_DIR metadata, not recorded per-TU compile commands.','Dynamic Make conditionals/options are not executed.','ARCH=aarch64 in configure differs from the installed 32-bit ARM compiler triple; compiler target wins for this profile.'],
          'unresolved_make_includes':unresolved[:100]})
    return {'version':1,'profiles':profiles,'suggested_default':'evb-entu_2i_10g',
            'default_basis':'united_build.sh default only, not proof of a previously executed build',
            'metadata_evidence_files':len(evidence),'unresolved_make_include_count':len(unresolved)}
