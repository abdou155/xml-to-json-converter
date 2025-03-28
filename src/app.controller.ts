/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/require-await */
import {
  Controller,
  Post,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  Get,
  Param,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Queue } from 'bull';
import { InjectQueue } from '@nestjs/bull';

interface JobStatus {
  id: string;
  status: 'pending' | 'completed' | 'failed';
  result?: any;
  error?: string;
}

@Controller()
export class AppController {
  private jobs: Record<string, JobStatus> = {};

  constructor(@InjectQueue('xml-queue') private readonly xmlQueue: Queue) {}

  @Post('convert')
  @UseInterceptors(FileInterceptor('file'))
  async convertXmlToJson(@UploadedFile() file: any) {
    if (!file) throw new BadRequestException('No file uploaded');
    if (!['text/xml', 'application/xml'].includes(file.mimetype)) {
      throw new BadRequestException('Invalid file type');
    }

    const xmlContent = file.buffer.toString('utf-8');
    const job = await this.xmlQueue.add('convert', { xmlContent });

    this.jobs[job.id] = {
      id: job.id.toString(),
      status: 'pending',
    };

    return { jobId: job.id };
  }

  @Get('status/:id')
  async getJobStatus(@Param('id') id: string) {
    const job = await this.xmlQueue.getJob(id);
    if (!job || !this.jobs[id]) throw new BadRequestException('Invalid job ID');

    if (await job.isFailed()) {
      this.jobs[id].status = 'failed';
      this.jobs[id].error = job.failedReason;
    } else if (await job.isCompleted()) {
      this.jobs[id].status = 'completed';
      this.jobs[id].result = job.returnvalue;
    }

    return this.jobs[id];
  }

  @Get('jobs')
  async listJobs() {
    const jobs = await this.xmlQueue.getJobs([
      'waiting',
      'active',
      'completed',
      'failed',
    ]);
    return jobs.map(async (job) => ({
      id: job.id,
      status: await job.getState(),
      progress: job.progress(),
      result: job.returnvalue,
      error: job.failedReason,
    }));
  }
}
