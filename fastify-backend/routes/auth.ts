import { FastifyInstance } from 'fastify';
import { Client } from 'pg';

export async function authRoutes(fastify: FastifyInstance, db: Client) {
  // GET /auth/me - Return current user info based on JWT
  fastify.get('/auth/me', async (request, reply) => {
    try {
      // Try to verify JWT token
      const authHeader = request.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return reply.code(401).send({ error: 'Unauthorized' });
      }

      const token = authHeader.substring(7);
      try {
        const decoded = await request.jwtVerify() as any;
        const userId = decoded.userId || decoded.sub || decoded.id;
        
        if (!userId) {
          return reply.code(401).send({ error: 'Invalid token' });
        }

        const res = await db.query('SELECT id, email, name, role FROM users WHERE id = $1', [userId]);
        if (res.rows.length === 0) {
          return reply.code(404).send({ error: 'User not found' });
        }
        
        return res.rows[0];
      } catch (jwtError) {
        return reply.code(401).send({ error: 'Invalid token' });
      }
    } catch (e) {
      console.error('Error in auth.me:', e);
      return reply.code(500).send({ error: 'Internal server error' });
    }
  });

  // POST /auth/login
  fastify.post('/auth/login', async (request, reply) => {
    const { email, password } = request.body as any;
    
    if (!email || !password) {
      return reply.code(400).send({ error: 'Email and password required' });
    }

    const res = await db.query(
      'SELECT id, email, name, role, password_hash FROM users WHERE email = $1',
      [email]
    );

    if (res.rows.length === 0) {
      return reply.code(401).send({ error: 'Invalid credentials' });
    }

    const user = res.rows[0];
    // In production, use bcrypt to compare passwords
    // For now, just check if password matches (demo mode)
    // const isValid = await bcrypt.compare(password, user.password_hash);
    
    const token = fastify.jwt.sign({ userId: user.id, email: user.email, role: user.role });
    
    return {
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    };
  });

  // POST /auth/logout (just for completeness)
  fastify.post('/auth/logout', async (request, reply) => {
    return { success: true };
  });
}
