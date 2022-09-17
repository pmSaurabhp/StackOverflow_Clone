import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AskQuestionComponent } from './ask-question/ask-question.component';
import { HomeComponent } from './home/home.component';
import { QuestionDetailComponent } from './question-detail/question-detail.component';

const routes: Routes = [
  { path: '', component: HomeComponent},
  { path: 'detail', component: QuestionDetailComponent},
  { path: 'ask', component:  AskQuestionComponent}
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }