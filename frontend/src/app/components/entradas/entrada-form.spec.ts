import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { EntradaService } from '../../services/entrada.service';
import { ProductoService } from '../../services/producto.service';
import { EntradaForm } from './entrada-form';

describe('EntradaForm', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EntradaForm],
      providers: [
        provideRouter([]),
        {
          provide: ProductoService,
          useValue: {
            listar: () => of([]),
            listarLotes: () => of([]),
          },
        },
        { provide: EntradaService, useValue: { registrar: () => of() } },
      ],
    }).compileComponents();
  });

  it('should create and render the entry form', () => {
    const fixture = TestBed.createComponent(EntradaForm);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('form')).toBeTruthy();
    expect(compiled.querySelector('#numeroLote')).toBeTruthy();
    expect(compiled.querySelector('#fechaVencimiento')).toBeTruthy();
  });
});
