/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Process, Processor } from '@nestjs/bull';
import { Job } from 'bull';
import { XmlConversionService } from './xml-conversion.service';

@Processor('xml-queue')
export class XmlProcessor {
  constructor(private readonly xmlService: XmlConversionService) {}

  @Process('convert')
  async handleConversion(job: Job<{ xmlContent: string }>) {
    try {
      const result = this.xmlService.convertXmlToJson(job.data.xmlContent);
      return { success: true, data: result };
    } catch (error) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      await job.moveToFailed({ message: error.message });
    }
  }
}
