import { Injectable } from '@nestjs/common';
import { XMLParser } from 'fast-xml-parser';

@Injectable()
export class XmlConversionService {
  private readonly parser: XMLParser;

  constructor() {
    this.parser = new XMLParser({
      attributeNamePrefix: '@_',
      textNodeName: '#text',
      ignoreAttributes: false,
      parseAttributeValue: true,
      allowBooleanAttributes: true,
      trimValues: true,
    });
  }

  convertXmlToJson(xmlData: string): any {
    try {
      return this.parser.parse(xmlData);
    } catch (error) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      throw new Error(`XML parsing error: ${error.message}`);
    }
  }
}
