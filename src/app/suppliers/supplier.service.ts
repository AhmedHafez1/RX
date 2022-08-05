/* eslint-disable rxjs/no-nested-subscribe */
import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';

import {
  throwError,
  Observable,
  of,
  map,
  concatMap,
  tap,
  mergeMap,
  switchMap,
  shareReplay,
  catchError,
} from 'rxjs';
import { Supplier } from './supplier';

@Injectable({
  providedIn: 'root',
})
export class SupplierService {
  suppliersUrl = 'api/suppliers';

  constructor(private http: HttpClient) {
    // this.supplierWithConcatMap$.subscribe((x) => console.log(`Supplier for concatMap `, x));
    // this.supplierWithMergeMap$.subscribe((x) => console.log(`Supplier for mergeMap `, x));
    // this.supplierWithSwitchMap$.subscribe((x) => console.log(`Supplier for switchMap `, x));
  }

  suppliers$ = this.http.get<Supplier[]>(this.suppliersUrl).pipe(
    tap((suppliers) => console.log('Suppliers', suppliers)),
    shareReplay(1),
    catchError((err) => this.handleError(err))
  );

  supplierWithConcatMap$ = of(1, 5, 8).pipe(
    tap((value) => console.log(`emitted from concatMap source obs (${value})`)),
    concatMap((id) => this.http.get<Supplier>(`${this.suppliersUrl}/${id}`))
  );

  supplierWithMergeMap$ = of(1, 5, 8).pipe(
    tap((value) => console.log(`emitted from mergeMap source obs (${value})`)),
    mergeMap((id) => this.http.get<Supplier>(`${this.suppliersUrl}/${id}`))
  );

  supplierWithSwitchMap$ = of(1, 5, 8).pipe(
    tap((value) => console.log(`emitted from switchMap source obs (${value})`)),
    switchMap((id) => this.http.get<Supplier>(`${this.suppliersUrl}/${id}`))
  );

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
