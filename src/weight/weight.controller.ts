import { Controller, Get, Post, Delete, Body, Param, Query, Request, UseGuards } from '@nestjs/common'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'
import { WeightService } from './weight.service'
import { CreateWeightDto } from './dto/create-weight.dto'

@Controller('weight')
@UseGuards(JwtAuthGuard)
export class WeightController {
  constructor(private readonly svc: WeightService) {}

  @Get()
  findAll(
    @Request() req: any,
    @Query('from')  from?:  string,
    @Query('to')    to?:    string,
    @Query('limit') limit?: string,
  ) {
    return this.svc.findAll(req.user.sub, { from, to, limit: limit ? parseInt(limit) : 90 })
  }

  @Get('last')
  getLast(@Request() req: any) {
    return this.svc.getLast(req.user.sub)
  }

  @Post()
  create(@Request() req: any, @Body() dto: CreateWeightDto) {
    return this.svc.create(req.user.sub, dto)
  }

  @Delete(':id')
  remove(@Request() req: any, @Param('id') id: string) {
    return this.svc.remove(req.user.sub, id)
  }
}
