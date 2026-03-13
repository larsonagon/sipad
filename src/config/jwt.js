import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

const SECRET = process.env.JWT_SECRET || 'sipad_super_secret_key';

export function generateToken(user) {
    return jwt.sign(
        {
            id: user.id,
            username: user.username,
            rol: user.nivel_acceso,
            dependencia: user.id_dependencia
        },
        SECRET,
        { expiresIn: '8h' }
    );
}

export function verifyToken(token) {
    return jwt.verify(token, SECRET);
}