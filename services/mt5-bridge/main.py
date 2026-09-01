import os
from fastapi import FastAPI, Header, HTTPException
import MetaTrader5 as mt5

app = FastAPI(title='ORENZA MT5 Bridge', version='0.1.0')
SERVICE_TOKEN = os.environ.get('MT5_BRIDGE_SERVICE_TOKEN', '')


def auth(value: str | None):
    if not SERVICE_TOKEN or value != f'Bearer {SERVICE_TOKEN}':
        raise HTTPException(status_code=401, detail='UNAUTHORIZED')


def connect():
    path = os.environ.get('MT5_TERMINAL_PATH') or None
    login = os.environ.get('MT5_LOGIN')
    password = os.environ.get('MT5_PASSWORD')
    server = os.environ.get('MT5_SERVER')
    kwargs = {}
    if login:
        kwargs['login'] = int(login)
    if password:
        kwargs['password'] = password
    if server:
        kwargs['server'] = server
    if not mt5.initialize(path, **kwargs):
        code, message = mt5.last_error()
        raise HTTPException(status_code=503, detail=f'MT5_INITIALIZE_FAILED:{code}:{message}')


def shutdown():
    try:
        mt5.shutdown()
    except Exception:
        pass


@app.get('/health')
def health(authorization: str | None = Header(default=None)):
    auth(authorization)
    return {'ok': True, 'service': 'mt5-bridge', 'mode': os.environ.get('MT5_ENVIRONMENT', 'DEMO')}


@app.get('/v1/accounts/{account_id}')
def account(account_id: str, authorization: str | None = Header(default=None)):
    auth(authorization)
    connect()
    try:
        info = mt5.account_info()
        if info is None or str(info.login) != str(account_id):
            raise HTTPException(status_code=404, detail='MT5_ACCOUNT_NOT_FOUND')
        return info._asdict()
    finally:
        shutdown()


@app.get('/v1/accounts/{account_id}/positions')
def positions(account_id: str, authorization: str | None = Header(default=None)):
    auth(authorization)
    connect()
    try:
        info = mt5.account_info()
        if info is None or str(info.login) != str(account_id):
            raise HTTPException(status_code=404, detail='MT5_ACCOUNT_NOT_FOUND')
        rows = mt5.positions_get() or ()
        return [p._asdict() for p in rows]
    finally:
        shutdown()


@app.get('/v1/quotes/{symbol}')
def quote(symbol: str, authorization: str | None = Header(default=None)):
    auth(authorization)
    connect()
    try:
        if not mt5.symbol_select(symbol, True):
            raise HTTPException(status_code=404, detail='MT5_SYMBOL_NOT_FOUND')
        tick = mt5.symbol_info_tick(symbol)
        if tick is None:
            raise HTTPException(status_code=404, detail='MT5_TICK_NOT_FOUND')
        return {'symbol': symbol, 'bid': tick.bid, 'ask': tick.ask, 'last': tick.last, 'volume': tick.volume, 'time': tick.time}
    finally:
        shutdown()


@app.get('/v1/markets')
def markets(authorization: str | None = Header(default=None)):
    auth(authorization)
    connect()
    try:
        rows = mt5.symbols_get() or ()
        return [{'symbol': s.name, 'description': s.description, 'visible': s.visible, 'currency_base': s.currency_base, 'currency_profit': s.currency_profit} for s in rows]
    finally:
        shutdown()
