"use client";

import { listen } from "@tauri-apps/api/event";
import { invoke } from "@tauri-apps/api/core";
import { getCurrentWindow } from "@tauri-apps/api/window";
import type { FormEvent } from "react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type GameQuestion = {
	label: string;
	hint: string;
};

type GameState = {
	premium: boolean;
	time_left: number;
	level: number;
	total: number;
	question: GameQuestion | null;
	complete: boolean;
	flag: string | null;
	feedback: string | null;
};

const isTauri =
	typeof window !== "undefined" &&
	("__TAURI__" in window || "__TAURI_INTERNALS__" in window);

export default function GamePage() {
	const router = useRouter();

	const [status, setStatus] = useState<"idle" | "premium" | "expired">("idle");

	const [timeLeft, setTimeLeft] = useState(0);

	const [flag, setFlag] = useState<string | null>(null);

	const [currentIndex, setCurrentIndex] = useState(0);

	const [totalLevels, setTotalLevels] = useState(0);

	const [question, setQuestion] = useState<GameQuestion | null>(null);

	const [answer, setAnswer] = useState("");

	const [feedback, setFeedback] = useState<string | null>(null);

	const [expiredCountdown, setExpiredCountdown] = useState<number | null>(null);

	const [showExpired, setShowExpired] = useState(false);

	useEffect(() => {
		if (!isTauri) {
			return;
		}

		const unlisten = listen("premium-expired", () => {
			setStatus("expired");

			setTimeLeft(0);

			setFeedback("Time's up! Re-login to continue where you left off.");

			setShowExpired(true);

			setExpiredCountdown(10);

			localStorage.setItem("photocalc_expired_at", String(Date.now() + 10000));
		});

		return () => {
			unlisten.then((fn) => fn());
		};
	}, []);

	useEffect(() => {
		if (!showExpired) {
			return;
		}

		const tick = () => {
			const stored = localStorage.getItem("photocalc_expired_at");

			if (!stored) {
				setExpiredCountdown(null);
				return;
			}

			const target = Number(stored);

			if (Number.isNaN(target)) {
				setExpiredCountdown(null);
				return;
			}

			const remainingMs = target - Date.now();

			const remaining = Math.max(0, Math.ceil(remainingMs / 1000));

			setExpiredCountdown(remaining);

			if (remaining <= 0) {
				localStorage.removeItem("photocalc_expired_at");

				getCurrentWindow().close();
			}
		};

		tick();

		const timer = setInterval(tick, 250);

		return () => {
			clearInterval(timer);
		};
	}, [showExpired]);

	useEffect(() => {
		if (!isTauri) {
			return;
		}

		let active = true;

		const refresh = async () => {
			try {
				const info = await invoke<GameState>("game_state");

				if (!active) {
					return;
				}

				setTimeLeft(info.time_left);

				setStatus(info.premium ? "premium" : "idle");

				setTotalLevels(info.total);

				setCurrentIndex(Math.max(0, info.level - 1));

				setQuestion(info.question);

				setFlag(info.flag ?? null);

				setFeedback(info.feedback ?? null);
			} catch {
				// Ignore polling errors.
			}
		};

		refresh();

		const interval = setInterval(refresh, 1000);

		return () => {
			active = false;
			clearInterval(interval);
		};
	}, []);

	const handleAnswer = (event: FormEvent) => {
		event.preventDefault();

		const given = Number(answer.trim());

		if (Number.isNaN(given)) {
			setFeedback("The answer doesn't feel correct.");

			return;
		}

		invoke<GameState>("submit_answer", {
			answer: given,
		})
			.then((info) => {
				setTimeLeft(info.time_left);

				setStatus(info.premium ? "premium" : "idle");

				setTotalLevels(info.total);

				setCurrentIndex(Math.max(0, info.level - 1));

				setQuestion(info.question);

				setFlag(info.flag ?? null);

				setFeedback(info.feedback ?? null);

				setAnswer("");
			})
			.catch(() => {
				setFeedback("Something is wrong. Check again.");
			});
	};

	return (
		<div className="flex min-h-screen items-center justify-center px-6 py-10 text-[15px] text-[#2a241f] sm:px-10">
			<section className="photocalc-card animate-float-in w-full max-w-2xl rounded-3xl p-6">
				<div className="flex flex-col gap-6">
					<div className="flex flex-wrap items-center justify-between gap-4">
						<div className="flex items-center gap-3">
							<span className="photocalc-mono text-xs uppercase tracking-[0.3em] text-[#6b5e54]">
								Anxiety Window
							</span>

							<span className="photocalc-mono rounded-full bg-[#f1dfcf] px-3 py-1 text-xs uppercase tracking-[0.2em] text-[#5b4a3b]">
								{timeLeft}s
							</span>
						</div>

						<div className="photocalc-mono text-xs uppercase tracking-[0.3em] text-[#6b5e54]">
							Compulsion {Math.min(currentIndex + 1, totalLevels || 1)}
						</div>
					</div>

					{status !== "premium" ? (
						<div className="rounded-2xl border border-[#e2d3c4] bg-white/70 p-6 text-sm text-[#5d544b]">
							You are not mentally prepared.
						</div>
					) : (
						<form onSubmit={handleAnswer} className="flex flex-col gap-4">
							<div className="rounded-2xl border border-[#e2d3c4] bg-white/70 p-5">
								<p className="photocalc-mono text-xs uppercase tracking-[0.2em] text-[#6b5e54]">
									Intrusive Thought
								</p>

								<div className="mt-3 text-3xl font-semibold text-[#1f1a15]">
									{question?.label ?? ""}
								</div>
							</div>

							<input
								placeholder="Type the only correct answer..."
								className="photocalc-mono w-full rounded-xl border border-[#d9c7b5] bg-white px-3 py-3 text-sm text-[#2a241f] outline-none focus:border-[#76d1b6]"
								value={answer}
								onChange={(event) => setAnswer(event.target.value)}
							/>

							<button
								type="submit"
								disabled={!question}
								className="rounded-xl bg-[#76d1b6] px-4 py-3 text-sm font-semibold uppercase tracking-[0.18em] text-[#0f3024] transition hover:bg-[#5bbf9f] disabled:cursor-not-allowed disabled:opacity-60"
							>
								Check Again
							</button>

							{feedback && <p className="text-sm text-[#5d544b]">{feedback}</p>}

							{flag && (
								<div className="mt-3 rounded-xl bg-[#1f1a15] px-4 py-3 text-sm text-white">
									{flag}
								</div>
							)}
						</form>
					)}
				</div>
			</section>

			{showExpired && (
				<div className="fixed inset-0 flex items-center justify-center bg-black/40 px-6">
					<div className="photocalc-card w-full max-w-sm rounded-3xl p-6 text-center">
						<h2 className="photocalc-title text-2xl">Compulsion Failed</h2>

						<p className="mt-3 text-sm text-[#5d544b]">
							You ran out of time. Closing in {expiredCountdown ?? 0}s.
						</p>

						<div className="mt-6 flex flex-col gap-3">
							<button
								type="button"
								onClick={() => {
									setExpiredCountdown(10);

									localStorage.setItem(
										"photocalc_expired_at",
										String(Date.now() + 10000),
									);

									router.push("/login");
								}}
								className="rounded-xl bg-[#e85d5d] px-4 py-3 text-sm font-semibold uppercase tracking-[0.18em] text-white transition hover:bg-[#c94b4b]"
							>
								Start Over
							</button>

							<button
								type="button"
								onClick={() => getCurrentWindow().close()}
								className="rounded-xl border border-[#1f1a15] px-4 py-3 text-xs font-semibold uppercase tracking-[0.28em] text-[#1f1a15] transition hover:bg-[#1f1a15] hover:text-white"
							>
								Give Up
							</button>
						</div>
					</div>
				</div>
			)}
		</div>
	);
}
