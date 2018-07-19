import { Component, OnInit } from '@angular/core'
import { CategoryService } from '../../services/category/category.service'
import { Category } from '../../models/category'

@Component({
  selector: 'category-list',
  templateUrl: './category-list.component.html',
  styleUrls: ['./category-list.component.scss']
})
export class CategoryListComponent implements OnInit {
  categories: Array<Category> = [];
  curCategory: number = -1;

  constructor(private categoryService: CategoryService) { }

  ngOnInit() {
  	this.categoryService.categoryList$.subscribe((cats) => {
    	this.categories = cats;
    	this.loadCategory(0);
    });
  }

  loadCategory(catInd) {
  	if (catInd === this.curCategory) return false;
  	var cat = this.categories[catInd];
  	if (!cat) return false;
  
  	var catArr = new Array<Category>();
    
  	if (catInd > 0) {
    	catArr.push(cat);
    }
  
  	this.categoryService.filterByCategories(catArr);
  	this.curCategory = catInd; // visual purpose
  }
}
