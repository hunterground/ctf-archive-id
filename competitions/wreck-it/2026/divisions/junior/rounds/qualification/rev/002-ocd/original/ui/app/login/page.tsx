"use client";

import { invoke } from "@tauri-apps/api/core";
import { getCurrentWindow } from "@tauri-apps/api/window";
import type { FormEvent } from "react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type PremiumInfo = {
	premium: boolean;
	exp: number;
	time_left: number;
	session_id: number;
};

// const DEFAULT_SERVER = "http://YOUR_VPS_HOST:21341";
const DEFAULT_SERVER = "http://localhost:21341";

const isTauri =
	typeof window !== "undefined" &&
	("__TAURI__" in window || "__TAURI_INTERNALS__" in window);

export default function LoginPage() {
	const router = useRouter();

	const [token, setToken] = useState("");
	const [username, setUsername] = useState("");

	const [status, setStatus] = useState<"idle" | "checking">("idle");

	const [error, setError] = useState<string | null>(null);

	const [expiryCountdown, setExpiryCountdown] = useState<number | null>(null);

	useEffect(() => {
		const tick = () => {
			const stored = localStorage.getItem("photocalc_expired_at");

			if (!stored) {
				setExpiryCountdown(null);
				return;
			}

			const target = Number(stored);

			if (Number.isNaN(target)) {
				setExpiryCountdown(null);
				return;
			}

			const remainingMs = target - Date.now();
			const remaining = Math.max(0, Math.ceil(remainingMs / 1000));

			setExpiryCountdown(remaining);

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
	}, []);

	const handleLogin = async (event: FormEvent) => {
		event.preventDefault();

		setError(null);

		if (!username.trim()) {
			setError("Identity confirmation required.");
			return;
		}

		if (!isTauri) {
			setError("Desktop environment required for reassurance ritual.");
			return;
		}

		try {
			setStatus("checking");

			const info = await invoke<PremiumInfo>("login", {
				username,
				licenseKey: token,
				serverUrl: DEFAULT_SERVER,
			});

			localStorage.setItem("photocalc_session_id", String(info.session_id));

			router.push("/game");
		} catch (err) {
			setStatus("idle");

			setError(
				`Verification failed. Please check everything again. (${String(err)})`,
			);
		}
	};

	return (
		<div className="flex min-h-screen items-center justify-center px-6 py-10 text-[15px] text-[#2a241f] sm:px-10">
			<section className="photocalc-card animate-float-in w-full max-w-md rounded-3xl p-6">
				<div className="flex items-center justify-between">
					<h1 className="photocalc-title text-3xl">Compulsion Checkpoint</h1>

					<span className="rounded-full bg-[#f1dfcf] px-3 py-1 text-xs uppercase tracking-[0.2em] text-[#5b4a3b]">
						{status === "checking" ? "checking" : "uncertain"}
					</span>
				</div>

				<p className="mt-4 text-sm text-[#5d544b]">
					If something feels wrong, start over.
				</p>

				{expiryCountdown !== null && (
					<div className="mt-4 rounded-2xl border border-[#f4b35f] bg-white/80 p-3 text-xs uppercase tracking-[0.2em] text-[#5b4a3b]">
						Anxiety!!! Session close in {expiryCountdown}s.
					</div>
				)}

				<form onSubmit={handleLogin} className="mt-6 flex flex-col gap-4">
					<label className="flex flex-col gap-2 text-xs uppercase tracking-[0.2em] text-[#6b5e54]">
						Name / Identity
						<input
							className="photocalc-mono rounded-xl border border-[#d9c7b5] bg-white/70 px-3 py-2 text-sm text-[#2a241f] outline-none focus:border-[#e85d5d]"
							value={username}
							onChange={(event) => setUsername(event.target.value)}
						/>
					</label>

					<label className="flex flex-col gap-2 text-xs uppercase tracking-[0.2em] text-[#6b5e54]">
						Reassurance Code, PCP-[XXXX]-[XXXX]
						<input
							className="photocalc-mono rounded-xl border border-[#d9c7b5] bg-white/70 px-3 py-2 text-sm text-[#2a241f] outline-none focus:border-[#e85d5d]"
							value={token}
							onChange={(event) => setToken(event.target.value)}
						/>
					</label>

					<button
						type="submit"
						disabled={status === "checking"}
						className="rounded-xl bg-[#e85d5d] px-4 py-3 text-sm font-semibold uppercase tracking-[0.18em] text-white transition hover:bg-[#c94b4b] disabled:cursor-not-allowed disabled:opacity-70"
					>
						{status === "checking" ? "Rechecking..." : "Seek Reassurance"}
					</button>
				</form>

				{error && <p className="mt-3 text-sm text-[#b04545]">{error}</p>}

				{!isTauri && (
					<p className="mt-3 text-xs text-[#6b5e54]">
						The ritual cannot begin outside the desktop environment.
					</p>
				)}
			</section>
		</div>
	);
}
