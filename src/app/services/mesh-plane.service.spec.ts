import { TestBed } from '@angular/core/testing';

import { MeshPlaneService } from './mesh-plane.service';

describe('MeshPlaneService', () => {
  let service: MeshPlaneService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(MeshPlaneService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
