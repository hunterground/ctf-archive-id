from jwcrypto import jwk
import os

class Config:
    DEBUG = False
    FLAG = "WRECKIT60{Wh0_N33ds_RS256?_HS256_1s_My_M4st3r_K3y!}"
    JWT_SECRET_KEY = jwk.JWK.generate(kty='RSA', size=2048)