import { test } from 'node:test';
import assert from 'node:assert/strict';
import { sportRecordEvent, socialCatEvent, waterGoalReached } from '../src/ui/cat-events.ts';
import type { Activity, PlanVersion, LocalDate } from '../src/domain/models.ts';

test('water celebration requires a real amount crossing, not a target edit or repeated save', () => {
  assert.equal(waterGoalReached(2000,2500,2500),true);
  assert.equal(waterGoalReached(2500,3000,2500),false);
  assert.equal(waterGoalReached(2000,2000,1500,2500),false);
  assert.equal(waterGoalReached(0,1000,2500),false);
});

test('sport events exclude edits and old dates; only a positive weekly goal can be completed', () => {
  const today = '2026-10-13' as LocalDate;
  const activity = {date: today,durationMinutes:30} as Activity;
  const plan = {movementDays:[{weekday:2,minutes:60}]} as PlanVersion;
  assert.equal(sportRecordEvent([],activity,plan,today,false),'sport-recorded');
  assert.equal(sportRecordEvent([{...activity,durationMinutes:30}],activity,plan,today,false),'sport-goal');
  assert.equal(sportRecordEvent([{...activity,durationMinutes:60}],activity,plan,today,false),'sport-recorded');
  assert.equal(sportRecordEvent([{...activity,date:'2026-10-06' as LocalDate,durationMinutes:60}],activity,plan,today,false),'sport-recorded');
  assert.equal(sportRecordEvent([],activity,null,today,false),'sport-recorded');
  assert.equal(sportRecordEvent([],activity,plan,today,true),null);
  assert.equal(sportRecordEvent([], {...activity,date:'2026-10-12' as LocalDate},plan,today,false),null);
});

test('social clips require confirmed state changes and never replay initial or unchanged state', () => {
  const empty = {friends:[],requests:[],groups:[],challenges:[]};
  const incoming = {...empty, requests:[{id:'a',incoming:true}]};
  assert.equal(socialCatEvent(null,incoming),null);
  assert.equal(socialCatEvent(incoming,incoming),null);
  assert.equal(socialCatEvent(empty,incoming),'friend-request');
  assert.equal(socialCatEvent(empty,{...empty,requests:[{id:'a',incoming:false}]}),null);
  assert.equal(socialCatEvent(incoming,{...empty,friends:[{id:'a'}]},'friend_accept'),'friend-added');
  const group = {...empty,groups:[{id:'g'}]};
  assert.equal(socialCatEvent(empty,group,'group_create'),'group-created');
  assert.equal(socialCatEvent(empty,group,'invite_redeem'),'group-joined');
  const challenge = {...empty,challenges:[{id:'c',joined:true}]};
  assert.equal(socialCatEvent(empty,challenge,'challenge_join'),'challenge-started');
  assert.equal(socialCatEvent(challenge,challenge,'challenge_join'),null);
});
