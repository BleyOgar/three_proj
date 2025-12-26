import * as Cannon from "cannon";

export const noFrictionMaterial = new Cannon.Material("noFriction");
export const NoFrictionContactMaterial = new Cannon.ContactMaterial(noFrictionMaterial, noFrictionMaterial, {
  friction: 0,
  restitution: 0,
});
