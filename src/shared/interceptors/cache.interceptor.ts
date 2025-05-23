import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject } from '@nestjs/common';
import { Observable, of } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Cache } from 'cache-manager';

@Injectable()
export class CacheInterceptor implements NestInterceptor {
  constructor(@Inject(CACHE_MANAGER) private cacheManager: Cache) {}

  async intercept(context: ExecutionContext, next: CallHandler): Promise<Observable<any>> {
    const request = context.switchToHttp().getRequest();
    const cacheKey = `${request.url}:${JSON.stringify(request.query)}`;
    
    // Try to get the data from cache
    const cachedData = await this.cacheManager.get(cacheKey);
    if (cachedData) {
      return of(cachedData);
    }

    // If not in cache, call the route handler and cache the result
    return next.handle().pipe(
      tap(async (data) => {
        await this.cacheManager.set(cacheKey, data);
      }),
    );
  }
}
