import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { App } from './app';

describe('App', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    })
      .compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  it('should render title', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('h1')?.textContent).toContain('Hospital San Gabriel');
  });

  it('should display the result of the connection check', () => {
    const fixture = TestBed.createComponent(App);
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
