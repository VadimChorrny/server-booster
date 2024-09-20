import Fastify, { FastifyInstance, RouteShorthandOptions } from 'fastify';
import { z } from 'zod';

// User types and validations
const userSchema = z.object({
  id: z.number().positive(),
  name: z.string().min(3),
  email: z.string().email(),
  age: z.number().min(18).max(100)
});

type User = z.infer<typeof userSchema>;

// In-memory user storage
class UserService {
  private users: User[] = [];

  addUser(user: User): User {
    this.users.push(user);
    return user;
  }

  getUserById(id: number): User | undefined {
    return this.users.find(user => user.id === id);
  }

  getAllUsers(): User[] {
    return this.users;
  }
}

// Controller layer
class UserController {
  constructor(private userService: UserService) {}

  createUser(data: any): User {
    const parsedData = userSchema.parse(data);
    return this.userService.addUser(parsedData);
  }

  getUser(id: number): User | undefined {
    return this.userService.getUserById(id);
  }

  listUsers(): User[] {
    return this.userService.getAllUsers();
  }
}

// Fastify server setup
const server: FastifyInstance = Fastify();
const userService = new UserService();
const userController = new UserController(userService);

// Route options
const createUserOpts: RouteShorthandOptions = {
  schema: {
    body: {
      type: 'object',
      properties: {
        id: { type: 'number' },
        name: { type: 'string' },
        email: { type: 'string' },
        age: { type: 'number' }
      },
      required: ['id', 'name', 'email', 'age']
    }
  }
};

// Routes
server.post('/users', createUserOpts, async (request, reply) => {
  try {
    const newUser = userController.createUser(request.body);
    reply.status(201).send(newUser);
  } catch (err) {
    reply.status(400).send({ error: 'Invalid user data' });
  }
});

server.get('/users/:id', async (request, reply) => {
  const id = parseInt((request.params as { id: string }).id);
  const user = userController.getUser(id);

  if (!user) {
    reply.status(404).send({ error: 'User not found' });
  } else {
    reply.send(user);
  }
});

server.get('/users', async (_, reply) => {
  const users = userController.listUsers();
  reply.send(users);
});

// Start server
const start = async () => {
  try {
    await server.listen({ port: 3000 });
    console.log('Server is running on http://localhost:3000');
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

start();
