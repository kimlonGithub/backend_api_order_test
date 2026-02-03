import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';

// Define a User interface/type
export interface User {
  id: number;
  name: string;
  email: string;
  createdAt: string;
}

@Injectable()
export class AppService {
  // In-memory storage (array) to store users
  // In real apps, you'd use a database
  private users: User[] = [];

  getHello(): string {
    return 'Hello World!';
  }

  createUser(userData: CreateUserDto): User {
    // Create a new user object
    const newUser: User = {
      id: Date.now(), // Simple ID generation for demo
      name: userData.name,
      email: userData.email,
      createdAt: new Date().toISOString(),
    };

    // Store the user in our array
    this.users.push(newUser);

    // Return the created user
    return newUser;
  }

  // New method: Get user by ID
  getUserById(id: number): User {
    // Find user in the array by ID
    const user = this.users.find((u) => u.id === id);

    // If user not found, throw an error
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    // Return the found user
    return user;
  }

  // Bonus: Get all users (useful for testing)
  getAllUsers(): User[] {
    return this.users;
  }
}
