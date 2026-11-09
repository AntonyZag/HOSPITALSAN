import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { CategoriaService } from '../../services/categoria.service';
import { ProductoService } from '../../services/producto.service';
import { ProductoForm } from './producto-form';

describe('ProductoForm', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProductoForm],
      providers: [
        provideRouter([]),
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { paramMap: convertToParamMap({}) } },
        },
        { provide: CategoriaService, useValue: { listar: () => of([]) } },
        {
          provide: ProductoService,
          useValue: {
            obtener: () => of(),
            crear: () => of(),
            actualizar: () => of(),
          },
        },
      ],
    }).compileComponents();
  });

  it('should create and render the product form', () => {
    const fixture = TestBed.createComponent(ProductoForm);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('form')).toBeTruthy();
    expect(compiled.querySelector('#codigo')).toBeTruthy();
    expect(compiled.querySelector('#idCategoria')).toBeTruthy();
  });
});
