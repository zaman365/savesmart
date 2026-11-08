import {scrypt,randomBytes,createHash,timingSafeEqual} from 'node:crypto';
import {promisify} from 'node:util';
import {fail} from './domain.mjs';
const derive=promisify(scrypt);
export async function hashPassword(password){if(typeof password!=='string'||password.length<12||password.length>128)fail(400,'Use a password with 12–128 characters.');const salt=randomBytes(16).toString('hex');return `${salt}:${Buffer.from(await derive(password,salt,64)).toString('hex')}`;}
export async function verifyPassword(password,stored){if(typeof password!=='string'||password.length>128)return false;const [salt,hex]=stored.split(':');const actual=Buffer.from(await derive(password,salt,64)),expected=Buffer.from(hex,'hex');return actual.length===expected.length&&timingSafeEqual(actual,expected);}
export const tokenHash=value=>createHash('sha256').update(value).digest('hex');
export function sessionUser(db,req){const token=(req.headers.cookie??'').split(';').map(x=>x.trim()).find(x=>x.startsWith('ss_session='))?.slice(11);if(!token)return null;return db.prepare('SELECT u.id,u.name,u.email,u.role FROM sessions s JOIN users u ON u.id=s.user_id WHERE s.token_hash=? AND s.expires_at>?').get(tokenHash(token),new Date().toISOString())??null;}
export function startSession(db,userId,res,secure){const token=randomBytes(32).toString('hex');db.prepare('DELETE FROM sessions WHERE expires_at<=?').run(new Date().toISOString());db.prepare('INSERT INTO sessions VALUES(?,?,?)').run(tokenHash(token),userId,new Date(Date.now()+7*86400000).toISOString());res.setHeader('Set-Cookie',`ss_session=${token}; HttpOnly; SameSite=Strict; Path=/; Max-Age=604800${secure?'; Secure':''}`);}
export function endSession(db,req,res,secure){const token=(req.headers.cookie??'').split(';').map(s=>s.trim()).find(s=>s.startsWith('ss_session='))?.slice(11);if(token)db.prepare('DELETE FROM sessions WHERE token_hash=?').run(tokenHash(token));res.setHeader('Set-Cookie',`ss_session=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0${secure?'; Secure':''}`);}
export function requireUser(user){if(!user)fail(401,'Sign in to continue.');return user;}
export function requireAdmin(user){requireUser(user);if(user.role!=='admin')fail(403,'Administrator access is required.');}
