import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { API_URL } from '../api';
import { CatalogCard } from './card-catalog';

export const CATALOG_SEARCH_LIMIT = 50;

@Injectable({ providedIn: 'root' })
export class CatalogService {
  private readonly http = inject(HttpClient);

  search(term: string): Observable<CatalogCard[]> {
    const params = new HttpParams().set('search', term.trim()).set('limit', CATALOG_SEARCH_LIMIT);
    return this.http.get<CatalogCard[]>(`${API_URL}/api/catalog`, { params });
  }

  getCard(catalogId: number): Observable<CatalogCard> {
    return this.http.get<CatalogCard>(`${API_URL}/api/catalog/${catalogId}`);
  }
}
