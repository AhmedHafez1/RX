import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';

import {
  BehaviorSubject,
  catchError,
  combineLatest,
  filter,
  forkJoin,
  map,
  merge,
  Observable,
  of,
  scan,
  shareReplay,
  Subject,
  switchMap,
  tap,
  throwError,
} from 'rxjs';

import { Product } from './product';
import { ProductCategoryService } from '../product-categories/product-category.service';
import { SupplierService } from '../suppliers/supplier.service';
import { Supplier } from '../suppliers/supplier';

@Injectable({
  providedIn: 'root',
})
export class ProductService {
  private productsUrl = 'api/products';
  private suppliersUrl = 'api/suppliers';

  private selectedProductSubject = new BehaviorSubject<number>(1);
  selectedProductAction$ = this.selectedProductSubject.asObservable();

  private addProductSubject = new Subject<Product>();
  addedProductAction$ = this.addProductSubject.asObservable();

  constructor(
    private http: HttpClient,
    private categoryService: ProductCategoryService,
    private supplierService: SupplierService
  ) {}

  products$ = this.http.get<Product[]>(this.productsUrl).pipe(
    tap((data) => console.log('Products: ', JSON.stringify(data))),
    catchError(this.handleError)
  );

  productsWithCategories$ = combineLatest([
    this.products$,
    this.categoryService.productCategories$,
  ]).pipe(
    map(([products, categories]) =>
      products.map(
        (product) =>
          ({
            ...product,
            price: product.price ? product.price * 2 : 0,
            searchKey: [product.productName],
            category: categories.find(
              (category) => category.id === product.categoryId
            )?.name,
          } as Product)
      )
    ),
    shareReplay(1)
  );

  productsWithAdd$ = merge(
    this.productsWithCategories$,
    this.addedProductAction$
  ).pipe(
    scan(
      (acc, value) => (value instanceof Array ? [...value] : [...acc, value]),
      [] as Product[]
    )
  );

  addProduct(newProduct?: Product) {
    newProduct = newProduct || this.fakeProduct();
    this.addProductSubject.next(newProduct);
  }

  selectedProduct$ = combineLatest([
    this.productsWithCategories$,
    this.selectedProductAction$,
  ]).pipe(
    map(([products, selectedProductId]) =>
      products.find((p) => p.id === selectedProductId)
    ),
    shareReplay(1)
  );

  // selectedProductSuppliers$ = combineLatest([
  //   this.selectedProduct$,
  //   this.supplierService.suppliers$,
  // ]).pipe(
  //   map(([product, suppliers]) =>
  //     suppliers.filter((supplier) =>
  //       product?.supplierIds?.includes(supplier.id)
  //     )
  //   )
  // );

  selectedProductSuppliers$ = this.selectedProduct$.pipe(
    switchMap((selectedProduct) => {
      if (selectedProduct?.supplierIds) {
        return forkJoin(
          selectedProduct.supplierIds.map((id) =>
            this.http.get<Supplier>(`${this.suppliersUrl}/${id}`)
          )
        );
      } else {
        return of([]);
      }
    }),
    tap((productSuppliers) =>
      console.log('Product Suppliers ', JSON.stringify(productSuppliers))
    )
  );

  selectedProductChange(selectedProductId: number) {
    this.selectedProductSubject.next(selectedProductId);
  }

  private fakeProduct(): Product {
    return {
      id: 42,
      productName: 'Another One',
      productCode: 'TBX-0042',
      description: 'Our new product',
      price: 8.9,
      categoryId: 3,
      category: 'Toolbox',
      quantityInStock: 30,
    };
  }

  private handleError(err: HttpErrorResponse): Observable<never> {
    // in a real world app, we may send the server to some remote logging infrastructure
    // instead of just logging it to the console
    let errorMessage: string;
    if (err.error instanceof ErrorEvent) {
      // A client-side or network error occurred. Handle it accordingly.
      errorMessage = `An error occurred: ${err.error.message}`;
    } else {
      // The backend returned an unsuccessful response code.
      // The response body may contain clues as to what went wrong,
      errorMessage = `Backend returned code ${err.status}: ${err.message}`;
    }
    console.error(err);
    return throwError(() => errorMessage);
  }
}
