import { TestBed } from '@angular/core/testing';

import { MeshCubeService } from './mesh-cube.service';

describe('MeshCubeService', () => {
  let service: MeshCubeService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(MeshCubeService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
