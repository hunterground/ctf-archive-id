FROM pwn.red/jail

COPY --from=alpine / /srv
COPY --chmod=0755 chall /srv/app/run
COPY --chmod=0644 flag.txt /srv/flag.txt

RUN cat <<EOF >/nsjail.cfg
mode:LISTEN
hostname:"app"
cwd:"/app"
port:5000
max_conns:0
max_conns_per_ip:0
time_limit:60
rlimit_as_type:HARD
rlimit_cpu_type:HARD
rlimit_fsize_type:HARD
rlimit_nofile_type:HARD
mount:{
    src:"/srv"
    dst:"/"
    is_bind:true
    nosuid:true
    nodev:true
}
mount {
	dst: "/app/uploads"
	fstype: "tmpfs"
	rw: true
	is_bind: false
}
cgroup_mem_max:209715200
cgroup_mem_swap_max:0
cgroup_pids_max:20
cgroup_cpu_ms_per_sec:100
cgroupv2_mount:"/jail/cgroup/unified/run"
use_cgroupv2:true
exec_bin:{
    path:"/app/run"
}
EOF
RUN echo -e '#!/bin/sh\ncp /nsjail.cfg /tmp/nsjail.cfg' >/jail/hook.sh
RUN mkdir /srv/app/uploads
