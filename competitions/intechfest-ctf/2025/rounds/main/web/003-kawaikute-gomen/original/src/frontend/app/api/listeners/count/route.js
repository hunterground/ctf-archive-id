import { NextResponse } from 'next/server';
import * as grpc from '@grpc/grpc-js';
import * as protoLoader from '@grpc/proto-loader';
import path from 'path';

export const runtime = 'nodejs';

const PROTO_PATH = process.env.PROTO_PATH || path.resolve(process.cwd(), '../backend/proto/music.proto');
const BACKEND_ADDR = process.env.BACKEND_ADDR || 'localhost:50051';

let client;
function getClient() {
	if (client) return client;
	const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
		keepCase: true,
		longs: String,
		enums: String,
		defaults: true,
		oneofs: true,
	});
	const loaded = grpc.loadPackageDefinition(packageDefinition);
	const music = loaded['music']?.v1;
	if (!music || !music.MusicService) throw new Error('Failed to load music.v1.MusicService');
	client = new music.MusicService(BACKEND_ADDR, grpc.credentials.createInsecure());
	return client;
}

export async function GET() {
	try {
		const c = getClient();
		const count = await new Promise((resolve, reject) => {
			c.GetListenerCount({}, (err, resp) => {
				if (err) return reject(err);
				resolve(resp?.count ?? 0);
			});
		});
		return NextResponse.json({ count }, { status: 200 });
	} catch (e) {
		return NextResponse.json({ error: 'grpc init/error' }, { status: 500 });
	}
}


