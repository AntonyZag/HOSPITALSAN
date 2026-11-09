import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ConnectionTest } from './components/connection-test';

@Component({
  imports: [ConnectionTest, RouterOutlet],
  selector: 'app-root',
  styleUrl: './app.css',
  templateUrl: './app.html',
})
export class App {}
