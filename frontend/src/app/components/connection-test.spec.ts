import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { ConnectionTest } from './connection-test';

describe('ConnectionTest', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ConnectionTest],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();
  });

  it('should display the result of the connection check', () => {
    const fixture = TestBed.createComponent(ConnectionTest);
    const http = TestBed.inject(HttpTestingController);
    const compiled = fixture.nativeElement as HTMLElement;
    fixture.detectChanges();

    compiled.querySelector('button')!.click();
    const request = http.expectOne('http://localhost:8000/api/test');
    expect(request.request.method).toBe('GET');
    request.flush({ success: true, message: 'Conexión a SQL Server exitosa.' });

    fixture.detectChanges();
    expect(compiled.querySelector('[role="status"]')?.textContent).toContain(
      'Conexión a SQL Server exitosa.',
    );
    http.verify();
  });
});
