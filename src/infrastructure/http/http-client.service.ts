import { HttpService } from '@nestjs/axios';
import { Injectable, Logger } from '@nestjs/common';
import { AppConfigService } from '@config/config.service';
import { AxiosRequestConfig } from 'axios';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class HttpClientService {
  private readonly logger = new Logger(HttpClientService.name);
  private readonly baseUrl: string;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: AppConfigService,
  ) {
    this.baseUrl = this.configService.tmsBackendUrl;
  }

  async get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    try {
      const response = await firstValueFrom(
        this.httpService.get<T>(`${this.baseUrl}${url}`, config),
      );
      return response.data;
    } catch (error) {
      this.logger.error(`GET request to ${url} failed: ${error.message}`);
      throw error;
    }
  }

  async post<T>(url: string, data: any, config?: AxiosRequestConfig): Promise<T> {
    try {
      const response = await firstValueFrom(
        this.httpService.post<T>(`${this.baseUrl}${url}`, data, config),
      );
      return response.data;
    } catch (error) {
      this.logger.error(`POST request to ${url} failed: ${error.message}`);
      throw error;
    }
  }

  async put<T>(url: string, data: any, config?: AxiosRequestConfig): Promise<T> {
    try {
      const response = await firstValueFrom(
        this.httpService.put<T>(`${this.baseUrl}${url}`, data, config),
      );
      return response.data;
    } catch (error) {
      this.logger.error(`PUT request to ${url} failed: ${error.message}`);
      throw error;
    }
  }

  async delete<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    try {
      const response = await firstValueFrom(
        this.httpService.delete<T>(`${this.baseUrl}${url}`, config),
      );
      return response.data;
    } catch (error) {
      this.logger.error(`DELETE request to ${url} failed: ${error.message}`);
      throw error;
    }
  }
}
