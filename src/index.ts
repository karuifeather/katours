import { Controller, Get, Server } from '@overnightjs/core';
import { Request, Response } from 'express';

@Controller('api/users')
class Test {
  @Get('')
  private getAll(req: Request, res: Response) {
    return res.json({ message: 'Hi' });
  }
}

class KatoursAPI extends Server {
  constructor() {
    super(true);
    this.setupControllers();
  }

  private setupControllers() {
    const test = new Test();
    super.addControllers(test);
  }

  public start(port: number): void {
    this.app.listen(port, () => {
      console.log(`Server is listening on port ${port}...`);
    });
  }
}

new KatoursAPI().start(5000);
