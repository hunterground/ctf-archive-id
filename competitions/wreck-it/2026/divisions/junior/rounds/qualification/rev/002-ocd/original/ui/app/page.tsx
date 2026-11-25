import Link from "next/link";

export default function Home() {
	return (
		<div className="flex min-h-screen flex-col gap-10 px-6 py-10 text-[15px] text-[#2a241f] sm:px-10">
			<header className="flex flex-col gap-3">
				<p className="photocalc-mono text-xs uppercase tracking-[0.3em] text-[#6b5e54]">
					OCD
				</p>

				<h1 className="photocalc-title text-5xl text-[#1f1a15] sm:text-6xl">
					ONE MORE TIME. JUST TO BE SURE.
				</h1>

				<p className="max-w-2xl text-base text-[#5d544b]">
					Every action feels unfinished, every answer feels wrong, and every
					second feeds the obsession.
				</p>
			</header>

			<main className="grid gap-8 lg:grid-cols-[360px_1fr]">
				<section className="photocalc-card animate-float-in rounded-3xl p-6">
					<h2 className="photocalc-title text-2xl">Compulsive Entry</h2>

					<p className="mt-4 text-sm text-[#5d544b]">
						If it feels wrong, the cycle starts again.
					</p>

					<div className="mt-6 flex flex-col gap-3">
						<Link
							href="/login"
							className="rounded-xl bg-[#e85d5d] px-4 py-3 text-sm font-semibold uppercase tracking-[0.18em] text-white transition hover:bg-[#c94b4b]"
						>
							Start Checking
						</Link>

						<Link
							href="/game"
							className="rounded-xl border border-[#1f1a15] px-4 py-3 text-xs font-semibold uppercase tracking-[0.28em] text-[#1f1a15] transition hover:bg-[#1f1a15] hover:text-white"
						>
							Enter The Loop
						</Link>
					</div>
				</section>

				<section className="photocalc-card animate-float-in rounded-3xl p-6">
					<div className="flex flex-col gap-3">
						<h2 className="photocalc-title text-3xl">Obsessive Cycle</h2>

						<p className="text-sm text-[#5d544b]">
							You have 30 seconds before panic takes over. Complete every task
							perfectly.
						</p>
					</div>

					<div className="mt-6 grid gap-3 sm:grid-cols-2">
						<div className="rounded-2xl border border-[#e2d3c4] bg-white/70 p-4">
							<p className="text-xs uppercase tracking-[0.2em] text-[#6b5e54]">
								Phase 1
							</p>

							<p className="mt-3 text-lg font-semibold text-[#1f1a15]">
								Seek Reassurance
							</p>

							<p className="mt-2 text-sm text-[#5d544b]">
								Request validation through the terminal.
							</p>
						</div>

						<div className="rounded-2xl border border-[#e2d3c4] bg-white/70 p-4">
							<p className="text-xs uppercase tracking-[0.2em] text-[#6b5e54]">
								Phase 2
							</p>

							<p className="mt-3 text-lg font-semibold text-[#1f1a15]">
								Repeat Until Calm
							</p>

							<p className="mt-2 text-sm text-[#5d544b]">
								Answer every prompt perfectly before the timer ends — or start
								over
							</p>
						</div>
					</div>
				</section>
			</main>
		</div>
	);
}
