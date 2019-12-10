import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';

import { throwError } from 'rxjs';
import { retry, catchError, tap } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  public first: string;
  public prev: string;
  public next: string;
  public last: string;

  private SERVER_URL = 'http://localhost:3000/products';
  constructor(private httpClient: HttpClient) { }

  parseLinkHeader(header) {
    if (header.length === 0) {
      return ;
    }

    const parts = header.split(',');
    const links = {};
    parts.forEach(p => {
      const section = p.split(';');
      const url = section[0].replace(/<(.*)>/, '$1').trim();
      const name = section[1].replace(/rel="(.*)"/, '$1').trim();
      links[name] = url;
    });

    this.first = links['first'];
    this.last = links['last'];
    this.prev = links['prev'];
    this.next = links['next'];
  }

  handleError(error: HttpErrorResponse) {
    let errorMessage = 'Unknown error!';
    if (error.error instanceof ErrorEvent) {
      // client-side
      errorMessage = `Error: ${error.error.message}`;
    } else {
      // server-side
      errorMessage = `Error code: ${error.status}\nMessage: ${error.message}`;
    }
    window.alert(errorMessage);
    return throwError(errorMessage);
  }

  public sendGetRequest() {
    return this.httpClient.get(this.SERVER_URL, {
      params: new HttpParams({fromString: '_page=1&_limit=20'}),
      observe: 'response'
    }).pipe(retry(3), catchError(this.handleError), tap(res => {
      console.log(res.headers.get('link'));
      this.parseLinkHeader(res.headers.get('link'));
    }));
    /* added the observe option with the response value in the options parameter of the get()
      so we can have the full HTTP response with headers, then we use the RxJS tap() for parsing
      the Link Header before returning the final Observable.
      sendGetRequest() is now returning an Observable. */
  }

  // Similar to sendGetRequest() except that it takes the URL to which we need to send an HTTP GET request
  public sendGetRequestToUrl(url: string) {
    return this.httpClient.get(url, { observe: 'response'}).pipe(retry(3),
    catchError(this.handleError), tap(res => {
      console.log(res.headers.get('Link'));
      this.parseLinkHeader(res.headers.get('Link'));
    }));
  }
}
