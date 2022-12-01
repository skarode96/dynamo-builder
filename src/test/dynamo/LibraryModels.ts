import { Table } from "../../main"

export const LibraryTable = new Table({
    name: "Library",
    delimiter: "-",
    partitionKeyName: "pk",
    sortKeyName: "sk"
})

export enum ModelType {
    Author = "Author",
    Book = "Book"
}

export interface Author {
    model: ModelType.Author
    pk: number
    sk: string
}

export interface Book {
    model: ModelType.Book
    id: number
    authorId: string
    name: string
}

export const AuthorModel = LibraryTable.model<Author>(ModelType.Author)
    .partitionKey("Author", "pk")
    .sortKey("Author", "sk")

export const BookModel = LibraryTable.model<Book>(ModelType.Book)
    .partitionKey("Author", "authorId")
    .sortKey("Book", "id")

export type Model = Author | Book

export const AuthorsPartition = LibraryTable.partition([AuthorModel, BookModel])
