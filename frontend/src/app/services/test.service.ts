import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import { ConnectionStatus } from '../interfaces/connection-status';

@Injectable({ providedIn: 'root' })
export class TestService {
  private readonly http = inject(HttpClient);

  checkConnection() {
    return this.http.get<ConnectionStatus>(`${environment.apiUrl}/test`);
  }
}
