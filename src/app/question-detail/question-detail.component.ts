import { HttpClient } from '@angular/common/http';
import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, Subject } from 'rxjs';
import { DataService } from '../data.service';
import { LoadingService } from '../loading.service';

@Component({
  selector: 'app-question-detail',
  templateUrl: './question-detail.component.html',
  styleUrls: ['./question-detail.component.css'],
  encapsulation: ViewEncapsulation.None,
})
export class QuestionDetailComponent implements OnInit {
  dataService: DataService;
  question: any;
  answerBody: any;
  answerOutput: any;
  userStatus: any;
  loading$ = this.loader.loading$;
  authRequired = false;
  parentFlag = true;
  voteFlag: any = 0;
  voteFlagAns: any = [];
  dataChange = new Subject<void>(); // subject is event emitter

  constructor(
    private http: HttpClient,
    private router: Router,
    dataService: DataService,
    public loader: LoadingService
  ) {
    this.dataService = dataService;
  }

  ngOnInit(): void {
    // question opened from home
    if (this.dataService.questionId != undefined) {
      console.log('dsq ', this.dataService.questionId);
      this.http
        .get<any>(
          'https://personal-stackoverflow.herokuapp.com/api/rest/question/' +
            this.dataService.questionId
        )
        .subscribe((data) => {
          this.question = data;
          this.voteStatus('ques', this.dataService.questionId);
          for (const [i, value] of this.question.answers.entries()) {
            this.voteStatus('ans', this.question.answers[i].id, i);
          }
          localStorage.setItem('question', JSON.stringify(this.question));
          console.log('data', data);
        });
    } else {
      // on page refresh
      this.question = JSON.parse(localStorage.getItem('question') || '{}');
      this.voteStatus('ques', this.question.id);
      for (const [i, value] of this.question.answers.entries()) {
        this.voteStatus('ans', this.question.answers[i].id, i);
      }
    }

    // when write answer or upvote, downvote is made
    this.dataChange.subscribe(() => {
      this.dataService.questionId = JSON.parse(
        localStorage.getItem('question') || '{}'
      ).id;

      // recall the question
      this.http
        .get<any>(
          'https://personal-stackoverflow.herokuapp.com/api/rest/question/' +
            this.dataService.questionId
        )
        .subscribe((data) => {
          this.question = data;
          localStorage.setItem('question', JSON.stringify(this.question));

          this.voteStatus('ques', this.dataService.questionId);
          for (const [i, value] of this.question.answers.entries()) {
            this.voteStatus('ans', this.question.answers[i].id, i);
          }

          console.log('data change', data);
        });
    });
  }

  vote(value: number, e: any, id: any) {
    if (localStorage.getItem('userData') == null) {
      this.gotoLogin();
    } else {
      console.log('head ', localStorage.getItem('userData'));
      const headers = {
        Authorization:
          'Bearer ' + JSON.parse(localStorage.getItem('userData') || '').token,
      };
      console.log('header ', headers);
      this.http
        .put<any>(
          'https://personal-stackoverflow.herokuapp.com/api/rest/' +
            e +
            '/' +
            id +
            '/' +
            value,
          null,
          { headers }
        )
        .subscribe((data) => {
          // console.log('voted ', data);
          this.dataChange.next(); // event emit so that subscribe can listen to it
        });
    }
  }
  voteStatus(qa: any, id: any, index = 0) {
    const headers = {
      Authorization:
        'Bearer ' + JSON.parse(localStorage.getItem('userData') || '').token,
    };
    this.http
      .get<any>(
        'https://personal-stackoverflow.herokuapp.com/api/rest/' +
          qa +
          '/vote/' +
          id,
        { headers }
      )
      .subscribe({
        next: (data) => {
          // console.log('vote status ', data);

          if (qa == 'ques') this.voteFlag = data.votes;
          else {
            this.voteFlagAns[index] = data.votes;
          }
        },
        error: (errorMessage) => {
          console.log(errorMessage);

          if (qa == 'ques') this.voteFlag = 0;
          else {
            this.voteFlagAns[index] = 0;
          }
          console.log(errorMessage.status);
          // return 0;
          // this.error = errorMessage;

          // this.isLoading = false;
        },
      });
  }

  gotoLogin() {
    if (localStorage.getItem('userData') == null) {
      this.authRequired = true;
    }
  }
  closeModal() {
    this.authRequired = false;
  }
  writeAnswer() {
    if (localStorage.getItem('userData') == null) {
      this.gotoLogin();
    } else {
      (<HTMLInputElement>document.querySelector('.write')).style.display =
        'none';
      (<HTMLInputElement>document.querySelector('.writeAnswer')).style.display =
        'block';
      (<HTMLInputElement>document.querySelector('.cancel')).style.display =
        'inline-block';
    }
  }
  cancelWrite() {
    (<HTMLInputElement>document.querySelector('.write')).style.display =
      'inline-block';
    (<HTMLInputElement>document.querySelector('.writeAnswer')).style.display =
      'none';
    (<HTMLInputElement>document.querySelector('.cancel')).style.display =
      'none';
  }
  addBreak(str: any) {
    return str.replace(/\n/g, '<br>');
  }
  addBold() {
    this.answerBody += '⁞⁞';
  }
  addCode() {
    this.answerBody += '⁗ write code here ⁗';
  }
  addStyle(str: any) {
    str = this.addBreak(str);

    while (str.search('⁞') != -1) {
      str = str.replace('⁞', `<p class="bold" data-placeholder="huhu ">`);
      str = str.replace('⁞', `</p>`);
    }
    while (str.search('⁗') != -1) {
      str = str.replace('⁗', `<div class="descP" placeholder="huhu code">`);
      str = str.replace('⁗', `</div>`);
    }

    this.answerOutput = str;
    return str;
  }
  onSubmit(newAnswer: any) {
    (<HTMLInputElement>document.querySelector('.write')).style.display =
      'inline-block';
    (<HTMLInputElement>document.querySelector('.writeAnswer')).style.display =
      'none';
    (<HTMLInputElement>document.querySelector('.cancel')).style.display =
      'none';
    if (newAnswer.invalid) {
      return;
    }

    const body = {
      answer: newAnswer.value.answerBody,
    };
    const headers = {
      Authorization:
        'Bearer ' + JSON.parse(localStorage.getItem('userData') || '').token,
    };
    this.http
      .post<any>(
        'https://personal-stackoverflow.herokuapp.com/api/rest/answer/' +
          this.question.id,
        body,
        { headers }
      )
      .subscribe((data) => {
        // this.postId = data.id;
        console.log('new Answer ', data);

        this.dataChange.next(); // event emit so that subscribe can listen to it
      });

    // this.router.navigate([`/courses`]);
  }
}
