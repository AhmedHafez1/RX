import { ChangeDetectionStrategy, Component } from '@angular/core';
import {
  catchError,
  combineLatest,
  EMPTY,
  filter,
  map,
  of,
  Subject,
} from 'rxjs';
import { Supplier } from 'src/app/suppliers/supplier';
import { Product } from '../product';

import { ProductService } from '../product.service';

@Component({
  selector: 'pm-product-detail',
  templateUrl: './product-detail.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductDetailComponent {
  private errorMessageSubject = new Subject<string>();
  errorMessage$ = this.errorMessageSubject.asObservable();

  constructor(private productService: ProductService) {}

  product$ = this.productService.selectedProduct$.pipe(
    catchError((error) => {
      this.errorMessageSubject.next(error);
      return EMPTY;
    })
  );

  pageTitle$ = this.product$.pipe(
    map((p) => 'Product Detail for : ' + p?.productName)
  );

  productSuppliers$ = this.productService.selectedProductSuppliers$.pipe(
    catchError((err) => {
      this.errorMessageSubject.next(err);
      return of([]);
    })
  );

  vm$ = combineLatest([
    this.product$,
    this.productSuppliers$,
    this.pageTitle$,
  ]).pipe(
    filter(([product]) => Boolean(product)),
    map(([product, productSuppliers, pageTitle]) => ({
      product,
      productSuppliers,
      pageTitle,
    }))
  );
}
